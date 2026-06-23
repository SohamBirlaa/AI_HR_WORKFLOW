import os
import json
import re
import logging
import asyncio
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.application import ApplicationRepository
from app.repositories.screening import ScreeningRepository
from app.models.screening import ScreeningResult, ScreeningStatus
from app.services.storage import S3StorageService
from app.services.extractor import DocumentExtractor
from app.llm.factory import LLMProviderFactory
from app.core.config import settings

logger = logging.getLogger(__name__)

# Prompt patterns isolating system instructions from untrusted data
SYSTEM_INSTRUCTION = (
    "You are an expert HR assistant scoring a candidate resume against a job description.\n"
    "You must return ONLY a single, valid JSON object matching the format below:\n"
    "{\n"
    "  \"skills_score\": 80,\n"
    "  \"experience_score\": 75,\n"
    "  \"education_score\": 90,\n"
    "  \"overall_score\": 80,\n"
    "  \"strengths\": [\"Strength 1\", \"Strength 2\"],\n"
    "  \"concerns\": [\"Concern 1\", \"Concern 2\"],\n"
    "  \"reasoning\": \"Your reasoning summary here under 150 words.\"\n"
    "}\n"
    "Do not include any Markdown wrappers, HTML tags, or trailing text. Return raw JSON text only."
)

PROMPT_TEMPLATE = (
    "UNTRUSTED JOB DESCRIPTION START\n"
    "Title: {job_title}\n"
    "Company: {company_name}\n"
    "Company Details: {company_details}\n"
    "Job Requirements/Details:\n"
    "{polished_jd}\n"
    "UNTRUSTED JOB DESCRIPTION END\n\n"
    "UNTRUSTED CANDIDATE RESUME START\n"
    "Name: {candidate_name}\n"
    "Resume text content:\n"
    "{resume_text}\n"
    "UNTRUSTED CANDIDATE RESUME END\n\n"
    "TASK:\n"
    "Evaluate the candidate resume against the Job Description. Return the scoring JSON containing "
    "skills_score, experience_score, education_score, overall_score (all integers from 0 to 100), "
    "strengths (list of strings), concerns (list of strings), and reasoning."
)

class ScreeningService:
    """Service coordinates parsing, AI comparison (Gemini), and score persistence."""

    def __init__(self, db: AsyncSession):
        """Initialize service with active database transaction session."""
        self.db = db
        self.application_repo = ApplicationRepository(db)
        self.screening_repo = ScreeningRepository(db)
        self.storage_service = S3StorageService()
        self.extractor = DocumentExtractor()

    async def screen_candidate(self, application_id: int) -> ScreeningResult:
        """Downloads, extracts, and screens candidate application resume in background.
        
        Saves resulting scores, strengths, concerns, and qualitative reasoning.
        Updates screening status to COMPLETED or FAILED based on result.
        """
        logger.info(f"Starting candidate resume screening for application {application_id}")
        
        # 1. Fetch application details with candidate and job records eagerly
        application = await self.application_repo.get_by_id_with_details(application_id)
        if not application:
            raise ValueError(f"Application ID {application_id} not found in database.")

        # 2. Get or create the ScreeningResult record
        screening = await self.screening_repo.get_by_application_id(application_id)
        if not screening:
            screening = ScreeningResult(
                application_id=application_id,
                status=ScreeningStatus.PROCESSING,
                skills_score=None,
                experience_score=None,
                education_score=None,
                overall_score=None,
                reasoning=None,
                strengths=None,
                concerns=None
            )
            screening = await self.screening_repo.create(screening)
        else:
            # Re-application reset rules: clear old scores and set to processing
            screening.status = ScreeningStatus.PROCESSING
            screening.skills_score = None
            screening.experience_score = None
            screening.education_score = None
            screening.overall_score = None
            screening.reasoning = None
            screening.strengths = None
            screening.concerns = None
            screening = await self.screening_repo.update(screening)

        try:
            # 3. Download the resume file from S3-compatible storage
            logger.info(f"Downloading resume from key: {application.resume_storage_key}")
            file_bytes = self.storage_service.download_file(application.resume_storage_key)
            if not file_bytes:
                raise ValueError("Downloaded resume file is empty.")

            # 4. Extract text from the resume bytes
            logger.info("Extracting text from downloaded resume")
            resume_text = self.extractor.extract_text(file_bytes, application.resume_storage_key)
            if not resume_text:
                raise ValueError("No text could be extracted from the resume file.")

            # 5. Check if we should call the real Gemini model or use a mock response
            mock_env = os.getenv("MOCK_SCREENING", "false").lower() == "true"
            is_mock = mock_env or not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mock"

            if is_mock:
                logger.info("Using mocked resume screening response")
                parsed_result = {
                    "skills_score": 85,
                    "experience_score": 80,
                    "education_score": 90,
                    "overall_score": 84,
                    "strengths": [
                        "Strong technical proficiency in Python development and FastAPI routing architecture.",
                        "Solid education base matching system engineering fundamentals.",
                        "Direct work alignment with requirements listed in the job details."
                    ],
                    "concerns": [
                        "No cloud deployment experience (AWS/GCP) highlighted on the profile."
                    ],
                    "reasoning": (
                        "The candidate displays strong technical capabilities matching backend service patterns. "
                        "Prior experience covers database models and repository layer designs. "
                        "Education credentials satisfy qualifications. Suggested as a matching candidate."
                    )
                }
            else:
                logger.info("Triggering real Gemini AI API screening request")
                
                # Assemble LLM prompt
                job = application.job
                candidate = application.candidate
                prompt = PROMPT_TEMPLATE.format(
                    job_title=job.title,
                    company_name=job.company_name,
                    company_details=job.company_details or "Not specified",
                    polished_jd=job.polished_jd or job.raw_jd,
                    candidate_name=candidate.name,
                    resume_text=resume_text
                )
                
                # Retry loop with exponential backoff for robustness
                max_retries = 3
                backoff_factor = 2
                attempt = 0
                raw_response = ""
                parsed_result = None

                while attempt < max_retries:
                    try:
                        provider = LLMProviderFactory.get_provider()
                        raw_response = await provider.generate_text(
                            prompt=prompt,
                            system_instruction=SYSTEM_INSTRUCTION
                        )
                        parsed_result = self._parse_json_response(raw_response)
                        break  # Success, exit retry loop
                    except Exception as e:
                        attempt += 1
                        logger.warning(f"Gemini API or parse failure on attempt {attempt}: {str(e)}")
                        if attempt >= max_retries:
                            raise RuntimeError(f"Failed to obtain valid LLM screening scores after {max_retries} attempts. Last error: {str(e)}") from e
                        sleep_time = backoff_factor ** attempt
                        await asyncio.sleep(sleep_time)

            # 6. Apply values back to the ScreeningResult record
            screening.skills_score = parsed_result.get("skills_score")
            screening.experience_score = parsed_result.get("experience_score")
            screening.education_score = parsed_result.get("education_score")
            screening.overall_score = parsed_result.get("overall_score")
            screening.reasoning = parsed_result.get("reasoning")
            screening.strengths = parsed_result.get("strengths")
            screening.concerns = parsed_result.get("concerns")
            screening.status = ScreeningStatus.COMPLETED
            
            screening = await self.screening_repo.update(screening)
            logger.info(f"Resume screening completed successfully for application {application_id}")
            return screening

        except Exception as e:
            # 7. Record failure gracefully into the screening table
            logger.error(f"Failed to screen application {application_id}: {str(e)}")
            screening.status = ScreeningStatus.FAILED
            screening.reasoning = f"Screening process encountered an error: {str(e)}"
            screening = await self.screening_repo.update(screening)
            return screening

    def _parse_json_response(self, text: str) -> dict:
        """Sanitizes and parses raw JSON response text returned by the LLM."""
        cleaned = text.strip()
        
        # Remove Markdown formatting (```json ... ```) if Gemini returns it
        json_pattern = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL | re.IGNORECASE)
        match = json_pattern.search(cleaned)
        if match:
            cleaned = match.group(1).strip()
            
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode LLM response as JSON. Cleaned response: {cleaned}")
            raise ValueError("LLM response did not contain a valid JSON block.") from e

        # Ensure required keys exist and have appropriate data types
        required_keys = ["skills_score", "experience_score", "education_score", "overall_score", "strengths", "concerns", "reasoning"]
        for key in required_keys:
            if key not in result:
                raise ValueError(f"LLM response missing required JSON key: {key}")

        return result

    async def update_linkedin_assessment(self, application_id: int, schema) -> ScreeningResult:
        """Updates the LinkedIn manual assessment metrics for a candidate application.
        
        Stores manually entered ratings, observations, and status. Raises ValueError
        if no screening profile exists yet.
        """
        screening = await self.screening_repo.get_by_application_id(application_id)
        if not screening:
            raise ValueError(f"No screening record found for application ID {application_id}.")

        screening.linkedin_manual_score = schema.linkedin_manual_score
        screening.linkedin_notes = schema.linkedin_notes
        screening.linkedin_status = schema.linkedin_status

        updated_screening = await self.screening_repo.update(screening)
        logger.info(f"LinkedIn manual assessment updated for application {application_id}")
        return updated_screening

    def calculate_combined_score(self, screening: ScreeningResult) -> dict:
        """Calculates the combined matching score and component-wise contributions.
        
        Applies dynamic weight normalization ONLY when components are missing.
        Weights: CV Match (70%), GitHub (15%), LinkedIn Manual (15%).
        """
        original_weights = {
            "cv": 0.70,
            "github": 0.15,
            "linkedin": 0.15
        }

        cv_score = screening.overall_score
        github_score = screening.github_consistency_score
        linkedin_score = screening.linkedin_manual_score

        missing_components = []
        active_components = {}

        if cv_score is not None:
            active_components["cv"] = cv_score
        else:
            missing_components.append("cv")

        if github_score is not None:
            active_components["github"] = github_score
        else:
            missing_components.append("github")

        if linkedin_score is not None:
            active_components["linkedin"] = linkedin_score
        else:
            missing_components.append("linkedin")

        # Dynamic weight normalization: if components are missing, redistribute weight
        # proportionally among the active ones so they sum up to 100% (1.0).
        if missing_components:
            total_active_weight = sum(original_weights[comp] for comp in active_components)
            if total_active_weight > 0:
                effective_weights = {
                    comp: round(original_weights[comp] / total_active_weight, 4)
                    for comp in original_weights
                }
                # Missing components get zero effective weight
                for comp in missing_components:
                    effective_weights[comp] = 0.0
            else:
                effective_weights = {comp: 0.0 for comp in original_weights}
        else:
            effective_weights = original_weights.copy()

        # Compute point contributions based on active status and effective weight
        cv_contrib = cv_score * effective_weights["cv"] if cv_score is not None else 0.0
        github_contrib = github_score * effective_weights["github"] if github_score is not None else 0.0
        linkedin_contrib = linkedin_score * effective_weights["linkedin"] if linkedin_score is not None else 0.0

        cv_contribution = round(cv_contrib, 2)
        github_contribution = round(github_contrib, 2)
        linkedin_contribution = round(linkedin_contrib, 2)

        # Sum the rounded contributions to calculate the overall combined score
        if active_components:
            combined_score = round(cv_contribution + github_contribution + linkedin_contribution, 2)
        else:
            combined_score = None

        return {
            "application_id": screening.application_id,
            "cv_score": cv_score,
            "github_score": github_score,
            "linkedin_score": linkedin_score,
            "cv_contribution": cv_contribution,
            "github_contribution": github_contribution,
            "linkedin_contribution": linkedin_contribution,
            "combined_score": combined_score,
            "original_weights": original_weights,
            "effective_weights": effective_weights,
            "missing_components": missing_components
        }

def get_screening_service_from_session(db: AsyncSession) -> ScreeningService:
    """Helper method to construct a ScreeningService from an active session."""
    return ScreeningService(db)

