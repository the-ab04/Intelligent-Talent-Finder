import os
import re
import uuid
import zipfile
import tempfile
import traceback
import hashlib
from pathlib import Path
import json

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from db import SessionLocal
from config import settings
from models import UploadJob, Resume

from langchain.prompts import load_prompt
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader

from utils.qdrant_client_wrapper import qdrant_client
from qdrant_client.models import PointStruct
from utils.logger import logger
from utils.model_loader import model

# === Constants ===
PROMPT_FILE = Path(__file__).parent / "prompt.json"
api_keys = [settings.api1, settings.api2]

# === Embedding & LLM Setup ===
embedder = model
prompt = load_prompt(PROMPT_FILE)
parser = JsonOutputParser()
qdrant = qdrant_client

def create_llm(api_key: str):
    return ChatGroq(model="llama-3.3-70b-versatile", api_key=api_key)

# === Helper: SHA256 hash
def compute_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

# === Resume Parsing ===
def parse_resume(text: str) -> dict:
    for key in api_keys:
        try:
            llm = create_llm(key)
            parser_chain = prompt | llm | parser
            parsed = parser_chain.invoke({"resume_text": text})

            if isinstance(parsed, dict) and parsed:
                return parsed
            logger.warning(f"⚠️ LLM with key {key[:10]} returned invalid data.")
        except Exception as e:
            logger.warning(f"⚠️ LLM failure with key {key[:10]}: {e}")
            if any(term in str(e).lower() for term in ["token", "rate limit", "api key"]):
                continue
            break
    logger.error("❌ All API keys failed. Parsing aborted.")
    return {}

# === Process Single Document ===
def process_document(db: Session, file_path: str) -> dict | None:
    filename = os.path.basename(file_path)

    try:
        loader = PyPDFLoader(file_path) if filename.endswith(".pdf") else Docx2txtLoader(file_path)
        pages = loader.load()
        full_text = "\n".join(p.page_content for p in pages)
        full_text = re.sub(r'[\x00-\x1F\x7F]', '', full_text)

        # Compute hash and check if already in DB
        doc_hash = str(uuid.uuid5(uuid.NAMESPACE_DNS, full_text))

        exists = db.query(Resume).filter(Resume.document_id == doc_hash).first()
        if exists:
            logger.info(f"⏭️ Skipping {filename} - already exists in DB.")
            return None

        # Parse via LLM
        parsed = parse_resume(full_text)
        if not parsed:
            raise ValueError("LLM parsing returned no data.")

        parsed["document_id"] = doc_hash  # Use content hash as ID

        db_resume = Resume(
            document_id=doc_hash,
            name=parsed.get("name"),
            email=parsed.get("email", "NA"),
            mobile_number=parsed.get("mobile_number"),
            years_experience=parsed.get("years_experience"),
            skills=parsed.get("skills") or [],
            prev_roles=parsed.get("roles") or [],
            location=parsed.get("location")
        )

        db.merge(db_resume)
        db.commit()

        embed_text = f"Skills: {', '.join(db_resume.skills)}\nExperience: {db_resume.years_experience} years\nRoles: {', '.join(db_resume.prev_roles)}"
        vector = embedder.encode([["Represent the resume for job relevance retrieval", embed_text]])[0]

        qdrant.upsert(
            collection_name=settings.qdrant_collection,
            points=[PointStruct(
                id=doc_hash,
                vector=vector,
                payload={
                    "document_id": doc_hash,
                    "skills": db_resume.skills,
                    "prev_roles": db_resume.prev_roles,
                    "experience": db_resume.years_experience,
                }
            )]
        )

        logger.info(f"✅ Processed and stored: {filename}")
        return parsed

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to process {filename}: {e}")
        traceback.print_exc()
        return None

# === Batch Upload Handler ===
def process_zip_file_for_api(zip_path: str, job_id: str):
    db = SessionLocal()
    try:
        job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
        if not job:
            logger.error(f"❌ No job found with ID: {job_id}")
            return

        job.status = "processing"
        db.commit()

        with tempfile.TemporaryDirectory() as temp_dir:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)

            files = [
                os.path.join(temp_dir, f)
                for f in os.listdir(temp_dir)
                if f.lower().endswith((".pdf", ".docx"))
            ]

            job.total_files = len(files)
            if job.total_files == 0:
                job.status = "failed"
                db.commit()
                logger.warning("⚠️ No valid files to process in uploaded ZIP.")
                return

            processed_count = 0
            for file_path in files:
                if process_document(db, file_path):
                    processed_count += 1

            job.processed_files = processed_count
            job.status = "completed" if processed_count == job.total_files else "completed_with_errors"
            db.commit()

            logger.info(f"📦 Upload job {job_id} completed: {processed_count}/{job.total_files} processed.")

    except Exception as e:
        logger.error(f"❌ Fatal error in upload job: {e}")
        traceback.print_exc()
        if job and job.status == "processing":
            job.status = "failed"
            db.commit()
    finally:
        db.close()
