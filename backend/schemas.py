from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    number: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    number: Optional[str] = None

    class Config:
        from_attributes = True

class ResumeOut(BaseModel):
    id: int
    document_id: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    years_experience: Optional[float] = None
    skills: List[str] = []
    prev_roles: List[str] = []  
    location: Optional[str] = None
    
    class Config:
        from_attributes = True
    
    @field_validator('email', mode='before')
    @classmethod
    def clean_email(cls, v):
        if not v or v in ("NA", "") or "@" not in v:
            return None
        return v
        
class JobDescriptionInput(BaseModel):
    description: str  
    top_k: int