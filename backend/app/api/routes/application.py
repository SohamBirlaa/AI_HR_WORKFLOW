from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_user
from app.repositories.application import ApplicationRepository
from app.services.candidate import CandidateService
from app.services.storage import S3StorageService
from app.schemas.candidate import ApplicationHRResponse
from app.schemas.screening import ScreeningResultResponse, LinkedInAssessmentUpdate, CombinedScoreResponse
from app.repositories.screening import ScreeningRepository
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


@router.get("/{application_id}/screening", response_model=ScreeningResultResponse)
async def get_application_screening(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve AI screening results for a specific application. Protected route.
    
    Checks credentials, queries database for ScreeningResult, and returns it.
    """
    application_repo = ApplicationRepository(db)
    application = await application_repo.get_by_id(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found."
        )

    screening_repo = ScreeningRepository(db)
    screening = await screening_repo.get_by_application_id(application_id)
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening result for application ID {application_id} not found."
        )
    return screening


@router.put("/{application_id}/linkedin-assessment", response_model=ScreeningResultResponse)
async def update_linkedin_assessment(
    application_id: int,
    schema: LinkedInAssessmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the LinkedIn manual assessment metrics for an application. Protected route.
    
    Validates parameter inputs, updates the screening model, and returns updated details.
    """
    from app.services.screening import ScreeningService
    service = ScreeningService(db)
    try:
        updated_screening = await service.update_linkedin_assessment(application_id, schema)
        return updated_screening
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update LinkedIn manual assessment: {str(e)}"
        )


@router.get("/{application_id}/combined-score", response_model=CombinedScoreResponse)
async def get_combined_score(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve dynamic combined match score and contributions. Protected route.
    
    Applies weight normalization when components are missing and returns score details.
    """
    screening_repo = ScreeningRepository(db)
    screening = await screening_repo.get_by_application_id(application_id)
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening record for application ID {application_id} not found."
        )

    from app.services.screening import ScreeningService
    service = ScreeningService(db)
    try:
        breakdown = service.calculate_combined_score(screening)
        return breakdown
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute combined score: {str(e)}"
        )


