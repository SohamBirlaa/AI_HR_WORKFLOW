import json
import re
from typing import Dict, Optional
from app.repositories.job import JobRepository
from app.repositories.social_asset import SocialAssetRepository
from app.models.job import JobStatus
from app.models.social_asset import SocialAsset, SocialPlatform
from app.llm.base import BaseLLMProvider

class SocialAssetService:
    """Service layer coordinating social media asset generation and persistence."""

    @staticmethod
    async def generate_social_content(
        job_repo: JobRepository,
        asset_repo: SocialAssetRepository,
        job_id: int,
        provider: BaseLLMProvider
    ) -> Optional[Dict[str, SocialAsset]]:
        """Generates social media content for all platforms from an approved or published job.
        
        Business Rules & Steps:
        1. Verify job existence and ensure status is either 'approved' or 'published'.
        2. Ensure a polished job description exists before continuing.
        3. Define platform constraints, structured JSON output format, and security delimiters.
        4. Make LLM call and parse the structured JSON response.
        5. Validate platform payload formats.
        6. Apply platform-specific modifications:
           - Twitter: Cap character count at 280, appending ellipses if needed.
           - Communities: Append unverified AI tags to ensure transparency.
        7. Execute database upsert: update values if they already exist, otherwise insert new.
        """
        job = await job_repo.get_by_id(job_id)
        if not job:
            return None

        # 1. State check - Social content can only be generated for jobs already approved or published
        if job.status not in (JobStatus.APPROVED, JobStatus.PUBLISHED):
            raise ValueError(
                f"Social content can only be generated for jobs with 'approved' or 'published' status. "
                f"Current status: {job.status.value}"
            )

        if not job.polished_jd:
            raise ValueError("Polished job description is missing or empty.")

        # 2. Setup prompts instructions & expected output structures
        system_instruction = (
            "SYSTEM INSTRUCTIONS:\n"
            "You are an expert social media manager.\n"
            "Your task is to analyze the provided polished job description and generate promotional marketing assets "
            "for four platforms: LinkedIn, Twitter/X, Facebook, and Instagram.\n\n"
            "CONSTRAINTS:\n"
            "1. Return output EXACTLY as a valid JSON object matching the JSON structure schema below. Do not add any markdown formatting, thoughts, explanation, or commentary outside the JSON block.\n"
            "2. The Twitter/X caption MUST be strictly under 280 characters.\n"
            "3. For each platform, provide 3 to 5 relevant suggested communities, pages, groups, or hashtags.\n"
            "4. Try to extract a location (e.g. City, State or Hybrid/Remote) from the job details or job description. Default to 'Remote' if not found.\n\n"
            "JSON SCHEMA OUTPUT:\n"
            "{\n"
            "  \"linkedin\": {\n"
            "    \"caption\": \"string\",\n"
            "    \"suggested_communities\": [\"string\"]\n"
            "  },\n"
            "  \"twitter\": {\n"
            "    \"caption\": \"string\",\n"
            "    \"suggested_communities\": [\"string\"]\n"
            "  },\n"
            "  \"facebook\": {\n"
            "    \"caption\": \"string\",\n"
            "    \"suggested_communities\": [\"string\"]\n"
            "  },\n"
            "  \"instagram\": {\n"
            "    \"caption\": \"string\",\n"
            "    \"suggested_communities\": [\"string\"]\n"
            "  },\n"
            "  \"location\": \"string\"\n"
            "}"
        )

        user_prompt_template = (
            "UNTRUSTED_INPUT_START\n"
            "Job Title: {title}\n"
            "Company: {company_name}\n"
            "Polished JD:\n{polished_jd}\n"
            "UNTRUSTED_INPUT_END\n\n"
            "TASK: Generate the JSON structured social media assets based on the job details above. Return ONLY the raw JSON block."
        )

        prompt = user_prompt_template.format(
            title=job.title,
            company_name=job.company_name,
            polished_jd=job.polished_jd
        )

        # 3. Call LLM Provider
        raw_output = await provider.generate_text(prompt, system_instruction)

        # Parse JSON from response (handles potential markdown wrapping)
        json_match = re.search(r"\{.*\}", raw_output, re.DOTALL)
        if not json_match:
            raise RuntimeError(f"LLM did not return a valid JSON object. Raw response: {raw_output}")

        try:
            content_data = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse LLM JSON output: {str(e)}. Raw response: {raw_output}") from e

        # Ensure all required platforms exist
        required_platforms = ["linkedin", "twitter", "facebook", "instagram"]
        for p in required_platforms:
            if p not in content_data or "caption" not in content_data[p] or "suggested_communities" not in content_data[p]:
                raise RuntimeError(f"LLM JSON missing data for platform '{p}'. Got: {content_data}")

        location = content_data.get("location") or "Remote"

        # 4. Save/Update each platform asset
        assets = {}
        for p in required_platforms:
            platform_enum = SocialPlatform(p)
            platform_data = content_data[p]
            caption = platform_data["caption"]
            communities = platform_data["suggested_communities"]

            # Enforce constraints:
            # - Twitter caption size limit (<= 280 characters)
            if platform_enum == SocialPlatform.TWITTER:
                if len(caption) > 280:
                    caption = caption[:277] + "..."

            # - Suggested communities must be labelled as AI-suggested and unverified
            labelled_communities = []
            for comm in communities:
                comm_str = str(comm).strip()
                if "AI-suggested and unverified" not in comm_str:
                    comm_str = f"{comm_str} (AI-suggested and unverified)"
                labelled_communities.append(comm_str)

            # Check if asset already exists to decide between creation or modification
            existing_asset = await asset_repo.get_by_job_and_platform(job_id, platform_enum)
            if existing_asset:
                existing_asset.caption = caption
                existing_asset.suggested_communities = labelled_communities
                existing_asset.visual_title = job.title
                existing_asset.visual_company = job.company_name
                existing_asset.visual_location = location
                asset = await asset_repo.update(existing_asset)
            else:
                new_asset = SocialAsset(
                    job_id=job_id,
                    platform=platform_enum,
                    caption=caption,
                    suggested_communities=labelled_communities,
                    visual_title=job.title,
                    visual_company=job.company_name,
                    visual_location=location
                )
                asset = await asset_repo.create(new_asset)

            assets[p] = asset

        return assets

    @staticmethod
    async def get_social_content(
        job_repo: JobRepository,
        asset_repo: SocialAssetRepository,
        job_id: int
    ) -> Optional[Dict[str, SocialAsset]]:
        """Retrieves existing social media assets for a job, if they exist."""
        job = await job_repo.get_by_id(job_id)
        if not job:
            return None

        db_assets = await asset_repo.get_by_job_id(job_id)
        if not db_assets:
            return None

        assets = {asset.platform.value: asset for asset in db_assets}
        required_platforms = ["linkedin", "twitter", "facebook", "instagram"]
        for p in required_platforms:
            if p not in assets:
                return None

        return assets
