from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from app.models.social_asset import SocialPlatform

class SocialAssetResponse(BaseModel):
    id: int
    job_id: int
    platform: SocialPlatform
    caption: str
    suggested_communities: List[str] = Field(..., description="List of unverified, AI-suggested groups/communities")
    visual_title: str
    visual_company: str
    visual_location: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SocialAssetBundleResponse(BaseModel):
    job_id: int
    linkedin: SocialAssetResponse
    twitter: SocialAssetResponse
    facebook: SocialAssetResponse
    instagram: SocialAssetResponse
