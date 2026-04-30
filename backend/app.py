from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import Base, engine, get_db, SessionLocal
from utils.qdrant_client_wrapper import setup_qdrant_collection
from utils.cleanup import cleanup_expired_resumes
from routes.auth import router as auth_router
from routes import resumes

from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from utils.logger import logger

# === Initialize FastAPI ===
app = FastAPI(title="Talent Finder API")

# === Enable CORS for frontend access ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Startup Event ===
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    setup_qdrant_collection()
    logger.info("PostgreSQL tables and Qdrant collection initialized.")

    # Schedule background cleanup for expired temporary resumes
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        lambda: cleanup_expired_resumes(SessionLocal()),
        trigger='interval',
        hours=24
    )
    scheduler.start()

    atexit.register(lambda: scheduler.shutdown(wait=False))
    logger.info("Background cleanup scheduler started.")

# === Manual Resume Cleanup Endpoint ===
@app.delete("/temp-cleanup", tags=["Admin"])
def delete_expired_temps(db: Session = Depends(get_db)):
    cleanup_expired_resumes(db)
    return {"message": "Expired temporary resumes deleted."}

# === Health Check ===
@app.get("/")
def read_root():
    return {"message": "Talent Finder API is running."}

# === Routers ===
app.include_router(auth_router, prefix="/auth")
app.include_router(resumes.router)
