import enum
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Text, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.social_asset import SocialAsset

class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    JD_GENERATED = "jd_generated"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"

class Job(Base):
    __tablename__ = "jobs"

    social_assets: Mapped[list["SocialAsset"]] = relationship(
        "SocialAsset", back_populates="job", cascade="all, delete-orphan"
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_jd: Mapped[str] = mapped_column(Text, nullable=False)
    polished_jd: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status", native_enum=True),
        default=JobStatus.DRAFT,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
