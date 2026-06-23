from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.social_asset import SocialAsset, SocialPlatform

class SocialAssetRepository:
    """Repository layer for database operations on the SocialAsset model.
    
    Manages storage and updates of promotional texts generated for social platforms.
    """

    def __init__(self, db: AsyncSession):
        """Initialize the repository with an active asynchronous database session."""
        self.db = db

    async def get_by_job_id(self, job_id: int) -> List[SocialAsset]:
        """Fetch all social media assets for a given job.
        
        Loads all platform posts (LinkedIn, Twitter, Facebook, Instagram) registered for a job opening.
        """
        result = await self.db.execute(select(SocialAsset).where(SocialAsset.job_id == job_id))
        return list(result.scalars().all())

    async def get_by_job_and_platform(self, job_id: int, platform: SocialPlatform) -> Optional[SocialAsset]:
        """Fetch a specific platform's social asset for a job.
        
        Enforces lookup by the unique index constraint (job_id, platform) to prevent duplicate platform rows.
        """
        result = await self.db.execute(
            select(SocialAsset).where(SocialAsset.job_id == job_id, SocialAsset.platform == platform)
        )
        return result.scalars().first()

    async def create(self, asset: SocialAsset) -> SocialAsset:
        """Add a new SocialAsset entity and commit transaction.
        
        Saves a newly generated platform asset to the database.
        """
        self.db.add(asset)
        await self.db.commit()
        await self.db.refresh(asset)
        return asset

    async def update(self, asset: SocialAsset) -> SocialAsset:
        """Commit updates to an existing SocialAsset and refresh.
        
        Allows modifying existing generated content on regeneration requests.
        """
        self.db.add(asset)
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
