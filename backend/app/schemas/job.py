from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.job import JobStatus

class JobBase(BaseModel):
    """Base schema holding common fields for Job operations."""
    title: str = Field(..., max_length=255)
    company_name: str = Field(..., max_length=255)
    company_details: Optional[str] = None
    raw_jd: str
    status: Optional[JobStatus] = JobStatus.DRAFT

class JobCreate(JobBase):
    """Schema for validating Job creation input."""
    pass

class JobUpdate(BaseModel):
    """Schema for validating Job partial updates."""
    title: Optional[str] = Field(None, max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    company_details: Optional[str] = None
    raw_jd: Optional[str] = None
    polished_jd: Optional[str] = None
    status: Optional[JobStatus] = None

class JobResponse(BaseModel):
    """Schema for returning serializable Job objects."""
    id: int
    title: str
    company_name: str
    company_details: Optional[str] = None
    raw_jd: str
    polished_jd: Optional[str] = None
    status: JobStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "title": "Software Engineer",
                "company_name": "Tech Corp",
                "company_details": "Innovative SaaS provider.",
                "raw_jd": "Looking for a Python developer...",
                "polished_jd": None,
                "status": "draft",
                "created_at": "2026-06-22T06:38:06.123456",
                "updated_at": "2026-06-22T06:38:06.123456"
            }
        }
