import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Float, ARRAY, DateTime
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    number = Column(String)
    password = Column(String, nullable=False)


class Resume(Base):
    __tablename__ = "resumes_llm"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String)
    mobile_number = Column(String)
    years_experience = Column(Float)
    skills = Column(ARRAY(Text))
    prev_roles = Column(ARRAY(Text))
    location = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class UploadJob(Base):
    __tablename__ = "upload_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    total_files = Column(Integer)
    processed_files = Column(Integer, default=0)
    status = Column(String, default="processing")
