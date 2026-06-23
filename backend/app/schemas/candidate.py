from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import Optional
from datetime import datetime
from app.models.application import ApplicationStatus

class PublicJobResponse(BaseModel):
    """Pydantic schema for exposing safe job details publicly (unauthenticated)."""
    id: int
    title: str
    company_name: str
    company_details: Optional[str] = None
    polished_jd: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateCreate(BaseModel):
    """Pydantic schema for candidate creation validation."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=50)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=255)

class CandidateResponse(BaseModel):
    """Pydantic schema for candidate data responses."""
    id: int
    name: str
    email: str
    phone: str
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    """Pydantic schema for application responses."""
    id: int
    candidate_id: int
    job_id: int
    resume_storage_key: str
    consent_given: bool
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
