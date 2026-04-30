import os
import traceback
import tempfile
import uuid
from typing import List

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy.inspection import inspect
from pydantic import BaseModel

from db import get_db
from models import Resume, UploadJob
from schemas import ResumeOut
from services.upload_backend.upload import process_zip_file_for_api
from services.search_batch import run_search_pipeline
from config import settings
from utils.qdrant_client_wrapper import qdrant_client
from qdrant_client.models import VectorParams, Distance
from utils.logger import logger

qdrant = qdrant_client

router = APIRouter()

# === Upload Endpoint ===
@router.post("/upload-resumes")
async def upload_zip(background_tasks: BackgroundTasks, db: Session = Depends(get_db), zipfile: UploadFile = File(...)):
    job = UploadJob(id=str(uuid.uuid4()), status="starting", total_files=0, processed_files=0)
    db.add(job)
    db.commit()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        tmp.write(await zipfile.read())
        zip_path = tmp.name

    background_tasks.add_task(process_zip_file_for_api, zip_path, job.id)

    return {"message": "Upload received and is being processed in the background.", "job_id": job.id}

# === Upload Status ===
@router.get("/upload-status/{job_id}")
def upload_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job.id,
        "status": job.status,
        "processed": job.processed_files,
        "total": job.total_files,
        "done": job.status == "done"
    }

# === Search ===
class SearchRequest(BaseModel):
    job_description: str
    top_k: int = 10

class CandidateProfile(ResumeOut):
    score: float

@router.post("/search", response_model=List[CandidateProfile])
async def search_resumes(request: SearchRequest, db: Session = Depends(get_db)):
    try:
        search_results = run_search_pipeline(request.job_description, request.top_k)
        if not search_results:
            return []

        doc_ids = [r.id for r in search_results]
        scores_map = {r.id: round(r.score, 2) for r in search_results}

        # Fetch from the single Resume table
        profiles_from_db = db.query(Resume).filter(Resume.document_id.in_(doc_ids)).all()

        response_profiles = []
        for profile in profiles_from_db:
            profile_data = {c.key: getattr(profile, c.key) for c in inspect(profile).mapper.column_attrs}
            profile_data['score'] = scores_map.get(profile.document_id, 0.0)
            email_value = profile_data.get('email')
            if not email_value or email_value == "NA":
                profile_data['email'] = None
            response_profiles.append(CandidateProfile(**profile_data))

        response_profiles.sort(key=lambda p: p.score, reverse=True)
        return response_profiles

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# === View Single Profile ===
@router.get("/profile/{document_id}", response_model=ResumeOut)
async def get_profile(document_id: str, db: Session = Depends(get_db)):
    profile = db.query(Resume).filter(Resume.document_id == document_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

# === Clear All Resumes ===
@router.delete("/clear-resumes", tags=["Admin"])
def clear_all_resumes(db: Session = Depends(get_db)):
    """
    Deletes all resume records from PostgreSQL and Qdrant.
    Re-initializes Qdrant collection to avoid downstream errors.
    """
    try:
        # 1. Delete vectors from Qdrant
        qdrant.delete_collection(settings.qdrant_collection)
        logger.info(f"🗑️ Qdrant collection '{settings.qdrant_collection}' deleted.")
        #2. Delete all upload jobs
        db.query(UploadJob).delete()
        db.commit()
        logger.info("🧹 UploadJob table cleared.")
        # 3. Clear all resume records from Postgres
        deleted_rows = db.query(Resume).delete()
        db.commit()
        logger.info(f"🗑️ Deleted {deleted_rows} resume records from PostgreSQL.")

        return {
            "status": "success",
            "message": "✅ All resumes cleared from PostgreSQL and Qdrant."
        }

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to clear resumes: {e}")
        return {
            "status": "error",
            "message": f"❌ Failed to clear data: {str(e)}"
        }

@router.get("/admin/status")
def get_admin_status(db: Session = Depends(get_db)):
    try:
        collection_info = qdrant.get_collection(settings.qdrant_collection)
        vector_count = collection_info.vectors_count
        qdrant_status = "🟢 Active"
    except:
        vector_count = "N/A"
        qdrant_status = "🔴 Failed"

    try:
        resume_count = db.query(Resume).count()
        db_status = "🟢 Connected"
    except:
        resume_count = "N/A"
        db_status = "🔴 Failed"

    return {
        "db_status": db_status,
        "qdrant_status": qdrant_status,
        "vector_count": vector_count,
        "resume_count": resume_count,
    }