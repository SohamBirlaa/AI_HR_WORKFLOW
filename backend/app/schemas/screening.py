from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
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
    
    # LinkedIn manual assessment fields
    linkedin_manual_score: Optional[int] = None
    linkedin_notes: Optional[str] = None
    linkedin_status: str = "unchecked"

    # GitHub check placeholder fields
    github_consistency_score: Optional[int] = None
    github_reasoning: Optional[str] = None
    github_status: str = "not_checked"

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LinkedInAssessmentUpdate(BaseModel):
    """Input validation schema for updating LinkedIn manual assessment metrics."""
    linkedin_manual_score: Optional[int] = Field(None, ge=0, le=100)
    linkedin_notes: Optional[str] = None
    linkedin_status: str = Field("unchecked")

    @field_validator("linkedin_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = {"unchecked", "verified", "weak", "red_flag"}
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return v


class CombinedScoreResponse(BaseModel):
    """Schema detailing the dynamic combined matching score and components contribution."""
    application_id: int
    cv_score: Optional[int] = None
    github_score: Optional[int] = None
    linkedin_score: Optional[int] = None
    cv_contribution: float
    github_contribution: float
    linkedin_contribution: float
    combined_score: Optional[float] = None
    original_weights: Dict[str, float]
    effective_weights: Dict[str, float]
    missing_components: List[str]

