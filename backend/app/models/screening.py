import enum
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.models.base import Base

class ScreeningStatus(str, enum.Enum):
    """Workflow states for the asynchronous AI resume screening pipeline."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ScreeningResult(Base):
    """Database model mapping AI resume screening metrics and reasoning for an application."""
    __tablename__ = "screening_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    status: Mapped[ScreeningStatus] = mapped_column(
        Enum(ScreeningStatus, name="screening_status", native_enum=True),
        default=ScreeningStatus.PENDING,
        nullable=False
    )
    skills_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    experience_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    education_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    strengths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    concerns: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # LinkedIn manual assessment fields
    linkedin_manual_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    linkedin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    linkedin_status: Mapped[str] = mapped_column(String(50), default="unchecked", server_default="unchecked", nullable=False)

    # GitHub check placeholder fields
    github_consistency_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    github_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    github_status: Mapped[str] = mapped_column(String(50), default="not_checked", server_default="not_checked", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationship back to application
    application = relationship("Application", back_populates="screening_result")

