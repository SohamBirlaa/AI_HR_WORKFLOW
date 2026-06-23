from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.screening import ScreeningStatus

class ScreeningResultResponse(BaseModel):
    """Pydantic schema for exposing AI Resume Screening results to the HR review dashboard."""
    id: int
    application_id: int
    status: ScreeningStatus
    skills_score: Optional[int] = None
    experience_score: Optional[int] = None
    education_score: Optional[int] = None
    overall_score: Optional[int] = None
    reasoning: Optional[str] = None
    strengths: Optional[List[str]] = None
    concerns: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
