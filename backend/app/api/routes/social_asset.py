from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_user
from app.repositories.job import JobRepository
from app.repositories.social_asset import SocialAssetRepository
from app.services.social_asset import SocialAssetService
from app.schemas.social_asset import SocialAssetBundleResponse
from app.models.user import User
from app.llm.factory import LLMProviderFactory

router = APIRouter(prefix="/jobs", tags=["social-assets"])

@router.post("/{id}/generate-social-content", response_model=SocialAssetBundleResponse)
async def generate_social_content(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate social media promotion content from an approved or published job. Protected route."""
    job_repo = JobRepository(db)
    asset_repo = SocialAssetRepository(db)
    
    try:
        provider = LLMProviderFactory.get_provider()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
        
    try:
        assets = await SocialAssetService.generate_social_content(
            job_repo=job_repo,
            asset_repo=asset_repo,
            job_id=id,
            provider=provider
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_524_A_TIMEOUT if "timeout" in str(e).lower() else status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider failed: {str(e)}"
        )
        
    if not assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {id} not found"
        )
        
    return SocialAssetBundleResponse(
        job_id=id,
        linkedin=assets["linkedin"],
        twitter=assets["twitter"],
        facebook=assets["facebook"],
        instagram=assets["instagram"]
    )
