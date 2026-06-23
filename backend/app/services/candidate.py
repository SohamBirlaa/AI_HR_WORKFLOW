from typing import Optional
from app.repositories.candidate import CandidateRepository
from app.repositories.application import ApplicationRepository
from app.repositories.job import JobRepository
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus
from app.models.job import JobStatus
from app.schemas.candidate import CandidateCreate
from app.services.storage_base import BaseStorageService

class CandidateService:
    """Service layer coordinating application routing validations and Candidate/Application business logic."""

    @staticmethod
    async def apply_to_job(
        candidate_repo: CandidateRepository,
        application_repo: ApplicationRepository,
        job_repo: JobRepository,
        storage_service: BaseStorageService,
        job_id: int,
        schema: CandidateCreate,
        consent_given: bool,
        file_content: bytes,
        filename: str,
        content_type: str
    ) -> Application:
        """Processes candidate job applications.
        
        Enforces Business Rules:
        1. Consent verification must happen before any DB writes.
        2. Ensure the job exists and status is 'published'.
        3. Verify the file format stream is valid (PDF/DOCX) using magic bytes.
        4. Manage re-applications (same candidate email for same job_id):
           - Updates candidate profile data to avoid duplicate rows.
           - Resets existing application's status to 'submitted' and overwrites key.
        """
        # Rule 1: Enforce consent validation at service layer before any db operations occur
        if not consent_given:
            raise ValueError("Candidate consent is required to process the application.")

        # Rule 2: Ensure the vacancy exists and is in 'published' state
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise ValueError(f"Job posting with ID {job_id} was not found.")
        if job.status != JobStatus.PUBLISHED:
            raise ValueError(f"Job posting status is '{job.status.value}'. Applications are only open for published jobs.")

        # Rule 3: File validation must run before upload is executed
        is_valid_file = storage_service.validate_resume_file(file_content, content_type)
        if not is_valid_file:
            raise ValueError("Invalid file upload. Only authentic PDF or DOCX files are allowed.")

        # Upload validated resume to obtain storage key
        resume_storage_key = await storage_service.upload_resume(file_content, filename)

        # Rule 4: Handle duplicate emails and applications. Check if candidate exists.
        candidate = await candidate_repo.get_by_email(schema.email)
        if candidate:
            # Update contact and social variables if they changed
            candidate.name = schema.name
            candidate.phone = schema.phone
            candidate.linkedin_url = schema.linkedin_url
            candidate.github_url = schema.github_url
            candidate = await candidate_repo.update(candidate)
        else:
            # Register new candidate profile
            candidate = Candidate(
                name=schema.name,
                email=schema.email,
                phone=schema.phone,
                linkedin_url=schema.linkedin_url,
                github_url=schema.github_url
            )
            candidate = await candidate_repo.create(candidate)

        # Check if an application already exists for this candidate/job combination
        application = await application_repo.get_by_candidate_and_job(candidate.id, job_id)
        if application:
            # Overwrite the resume key, reset status back to submitted, and update
            application.resume_storage_key = resume_storage_key
            application.consent_given = True
            application.status = ApplicationStatus.SUBMITTED
            # Note: Score clearing will be implemented in Phase 5 screening
            application = await application_repo.update(application)
        else:
            # Register new application record
            application = Application(
                candidate_id=candidate.id,
                job_id=job_id,
                resume_storage_key=resume_storage_key,
                consent_given=True,
                status=ApplicationStatus.SUBMITTED
            )
            application = await application_repo.create(application)

        return application
