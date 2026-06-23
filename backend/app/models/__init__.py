# Centralized imports for Alembic metadata detection
from app.models.base import Base
from app.models.user import User
from app.models.job import Job
from app.models.social_asset import SocialAsset, SocialPlatform
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus

__all__ = ["Base", "User", "Job", "SocialAsset", "SocialPlatform", "Candidate", "Application", "ApplicationStatus"]