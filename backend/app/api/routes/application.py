from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_user
from app.repositories.application import ApplicationRepository
from app.services.candidate import CandidateService
from app.services.storage import S3StorageService
from app.schemas.candidate import ApplicationHRResponse
from app.models.user import User

router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("/{application_id}", response_model=ApplicationHRResponse)
async def get_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of a single job application. Protected route.
    
    Checks valid JWT token, queries CandidateService to eager-load relations,
    generates a secure resume download URL, and returns the response schema.
    """
    application_repo = ApplicationRepository(db)
    storage_service = S3StorageService()
    
    try:
        application = await CandidateService.get_application_by_id(
            application_repo=application_repo,
            storage_service=storage_service,
            application_id=application_id
        )
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with ID {application_id} not found."
            )
        return application
    except HTTPException:
        # Re-raise standard HTTPExceptions to preserve their status code
        raise
    except Exception as e:
        # Catch and wrap unexpected server/DB exceptions in JSON format
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve application details: {str(e)}"
        )
