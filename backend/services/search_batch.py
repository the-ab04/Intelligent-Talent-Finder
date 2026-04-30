import os
import json
from typing import List
from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import load_prompt
from langchain_groq import ChatGroq
from config import settings
from utils.qdrant_client_wrapper import qdrant_client
from qdrant_client.models import PointStruct
from utils.logger import logger
from utils.model_loader import model

# === LLM & Prompt Setup ===
GROQ_MODEL = "llama-3.3-70b-versatile"
BATCH_SIZE = 20

class CandidateScore(BaseModel):
    id: str = Field(description="The document ID of the candidate")
    score: int = Field(ge=1, le=100, description="Match score from 1 to 100")

class CandidateScores(BaseModel):
    results: List[CandidateScore]

parser = PydanticOutputParser(pydantic_object=CandidateScores)

prompt_path = os.path.join(os.path.dirname(__file__), "structured_ranking_prompt.json")
prompt = load_prompt(prompt_path)

llm = ChatGroq(
    model=GROQ_MODEL,
    temperature=0,
    api_key=settings.api
)

chain = prompt | llm | parser

# === Embedding and Qdrant Setup ===
embedder = model
qdrant = qdrant_client

def run_search_pipeline(job_description: str, top_k: int = 10) -> List[CandidateScore]:
    query_instruction = "Represent the job description for matching resumes:"
    query_vector = embedder.encode([[query_instruction, job_description]])[0].tolist()

    search_results = qdrant.query_points(
        collection_name=settings.qdrant_collection,
        query=query_vector,
        score_threshold=0.55,
        with_payload=True,
        limit=50,
    ).points

    candidate_payloads = [
        {
            "id": p.payload.get("document_id"),
            "skills": p.payload.get("skills", []),
            "roles": p.payload.get("prev_roles", []),  # fixed key
            "experience": p.payload.get("experience", 0),
        }
        for p in search_results
        if p.payload and p.payload.get("document_id")
    ]

    all_ranked = []

    for i in range(0, len(candidate_payloads), BATCH_SIZE):
        batch = candidate_payloads[i:i + BATCH_SIZE]
        try:
            result = chain.invoke({
                "job_description": job_description,
                "candidates": json.dumps(batch),
                "format_instructions": parser.get_format_instructions()
            })
            all_ranked.extend(result.results)
        except Exception as e:
            logger.warning(f"⚠️ Batch {i//BATCH_SIZE + 1} failed: {e}")

    return sorted(all_ranked, key=lambda x: x.score, reverse=True)[:top_k]
