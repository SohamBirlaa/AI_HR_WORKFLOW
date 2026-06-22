import enum
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, JSON, UniqueConstraint, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.models.base import Base

class SocialPlatform(str, enum.Enum):
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"

class SocialAsset(Base):
    __tablename__ = "social_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[SocialPlatform] = mapped_column(
        Enum(SocialPlatform, name="social_platform", native_enum=True),
        nullable=False
    )
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_communities: Mapped[list] = mapped_column(JSON, nullable=False)
    visual_title: Mapped[str] = mapped_column(String(255), nullable=False)
    visual_company: Mapped[str] = mapped_column(String(255), nullable=False)
    visual_location: Mapped[str] = mapped_column(String(255), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Unique constraint on job_id and platform
    __table_args__ = (
        UniqueConstraint("job_id", "platform", name="uq_social_asset_job_platform"),
    )

    # Relationship
    job = relationship("Job", back_populates="social_assets")
