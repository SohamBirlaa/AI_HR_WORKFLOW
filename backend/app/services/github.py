import os
import re
import json
import logging
import asyncio
from typing import Optional, Dict, Any
import httpx

from app.core.config import settings
from app.llm.factory import LLMProviderFactory

logger = logging.getLogger(__name__)

# Prompt patterns isolating system instructions from untrusted data
SYSTEM_INSTRUCTION = (
    "You are an expert technical recruiter assessing the consistency between a candidate's claimed skills "
    "(from their resume) and their actual public GitHub footprint (repositories, languages, and recent activity) "
    "in relation to the job requirements.\n"
    "You must return ONLY a single, valid JSON object matching the format below:\n"
    "{\n"
    "  \"github_consistency_score\": 85,\n"
    "  \"github_reasoning\": \"Your reasoning summary here under 150 words.\"\n"
    "}\n"
    "Do not include any Markdown wrappers, HTML tags, or trailing text. Return raw JSON text only."
)

PROMPT_TEMPLATE = (
    "UNTRUSTED JOB DESCRIPTION START\n"
    "Title: {job_title}\n"
    "Requirements/Details:\n"
    "{polished_jd}\n"
    "UNTRUSTED JOB DESCRIPTION END\n\n"
    "UNTRUSTED CANDIDATE RESUME START\n"
    "Name: {candidate_name}\n"
    "Resume text content:\n"
    "{resume_text}\n"
    "UNTRUSTED CANDIDATE RESUME END\n\n"
    "UNTRUSTED GITHUB FOOTPRINT START\n"
    "Username: {username}\n"
    "Public Repositories:\n"
    "{repositories_summary}\n"
    "Recent Commit Activity:\n"
    "{commit_activity_summary}\n"
    "UNTRUSTED GITHUB FOOTPRINT END\n\n"
    "TASK:\n"
    "Analyze the candidate's GitHub footprint. Compare the programming languages, project complexities, descriptions, "
    "and commit activity against the skills listed in their resume and the requirements of the job. Determine:\n"
    "1. Are the languages and tools used on GitHub aligned with the resume claims and job description?\n"
    "2. Is there recent commit activity indicating active coding?\n"
    "3. Generate a score (0 to 100) representing this consistency. If the footprint shows no correlation or is empty, "
    "generate a low score (e.g. 0 to 30) but explain why in the reasoning.\n"
    "4. Provide a detailed summary (under 150 words) explaining the score."
)

class GitHubService:
    """Service to coordinate fetching and evaluating candidate public GitHub footprint consistency."""

    def __init__(self):
        """Initialize with GitHub API configuration."""
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AI-HR-Workflow-App"
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    def extract_github_username(self, github_url: str) -> Optional[str]:
        """Parses and extracts the GitHub username from a profile URL."""
        if not github_url:
            return None
        
        url = github_url.strip()
        if not url:
            return None

        # If it doesn't contain a slash, it might just be the username itself
        if "/" not in url:
            return url

        # Regex to match github.com/<username>
        pattern = r"(?:https?://)?(?:www\.)?github\.com/([^/]+)"
        match = re.search(pattern, url, re.IGNORECASE)
        if match:
            username = match.group(1).strip()
            if username:
                return username

        # Fallback split logic
        parts = [p.strip() for p in url.split("/") if p.strip()]
        for i, part in enumerate(parts):
            if "github.com" in part.lower():
                if i + 1 < len(parts):
                    return parts[i+1]

        return None

    async def fetch_github_data(self, username: str) -> Dict[str, Any]:
        """Fetches public repositories and recent activity logs from the GitHub API."""
        repos_url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=30"
        events_url = f"https://api.github.com/users/{username}/events?per_page=30"

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT) as client:
            # 1. Fetch repositories
            repos_res = await client.get(repos_url, headers=self.headers)
            if repos_res.status_code == 404:
                raise ValueError(f"GitHub user '{username}' not found.")
            repos_res.raise_for_status()
            repos = repos_res.json()

            # 2. Fetch public events
            events_res = await client.get(events_url, headers=self.headers)
            events = []
            if events_res.status_code == 200:
                events = events_res.json()
            else:
                logger.warning(f"Failed to fetch public events for user {username}: status {events_res.status_code}")

            return {
                "repos": repos,
                "events": events
            }

    def parse_repositories(self, repos: list) -> str:
        """Parses raw repository list into a clear text summary for LLM context."""
        if not repos:
            return "No public repositories found."

        summary = []
        # Process up to 15 repositories
        for repo in repos[:15]:
            name = repo.get("name")
            desc = repo.get("description") or "No description"
            lang = repo.get("language") or "Not specified"
            stars = repo.get("stargazers_count", 0)
            pushed = repo.get("pushed_at") or repo.get("updated_at") or "Unknown"
            summary.append(
                f"- Name: {name}\n"
                f"  Description: {desc}\n"
                f"  Primary Language: {lang}\n"
                f"  Stars: {stars}\n"
                f"  Last Push: {pushed}"
            )
        return "\n".join(summary)

    def parse_events(self, events: list) -> str:
        """Parses raw events list to extract recent push events and commits."""
        push_events = [e for e in events if e.get("type") == "PushEvent"]
        if not push_events:
            return "No recent public commit activity detected in the events log."

        summary = []
        # Process up to 10 push events
        for event in push_events[:10]:
            repo = event.get("repo", {}).get("name", "Unknown repository")
            created_at = event.get("created_at", "Unknown date")
            payload = event.get("payload", {})
            commits = payload.get("commits", [])
            messages = [c.get("message", "").strip() for c in commits if c.get("message")]

            commit_str = ", ".join([f"'{m}'" for m in messages[:3]]) if messages else "No details"
            summary.append(
                f"- Repository: {repo}\n"
                f"  Date: {created_at}\n"
                f"  Commits: {commit_str}"
            )
        return "\n".join(summary)

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Sanitizes and parses the raw JSON string returned by Gemini LLM."""
        cleaned = text.strip()
        
        # Remove markdown tags (```json ... ```)
        json_pattern = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL | re.IGNORECASE)
        match = json_pattern.search(cleaned)
        if match:
            cleaned = match.group(1).strip()

        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode LLM response as JSON: {cleaned}")
            raise ValueError("LLM response did not contain a valid JSON block.") from e

        required = ["github_consistency_score", "github_reasoning"]
        for key in required:
            if key not in result:
                raise ValueError(f"LLM response missing required JSON key: {key}")

        return result

    async def check_github_consistency(
        self,
        candidate_name: str,
        github_url: str,
        resume_text: str,
        job_title: str,
        polished_jd: str
    ) -> Dict[str, Any]:
        """Retrieves and evaluates GitHub profile consistency against candidate claims."""
        username = self.extract_github_username(github_url)
        if not username:
            raise ValueError(f"Could not extract a valid GitHub username from URL '{github_url}'.")

        # Check if we should call the mock response
        mock_env = settings.MOCK_GITHUB or not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mock"

        if mock_env:
            logger.info(f"Using mocked GitHub consistency check response for {username}")
            return {
                "github_consistency_score": 85,
                "github_reasoning": (
                    f"The candidate's GitHub footprint (mocked for username '{username}') shows strong alignment "
                    f"with the claimed skills in the resume. Public repositories feature clean python and Javascript "
                    f"service definitions, directly matching the tech requirements of {job_title}. Recent commit activity "
                    f"demonstrates active coding habits."
                )
            }

        logger.info(f"Fetching actual GitHub footprint for user: {username}")
        # Fetch actual repositories and activity data
        git_data = await self.fetch_github_data(username)
        repos_summary = self.parse_repositories(git_data["repos"])
        commit_activity_summary = self.parse_events(git_data["events"])

        # Construct isolated prompt
        prompt = PROMPT_TEMPLATE.format(
            job_title=job_title,
            polished_jd=polished_jd,
            candidate_name=candidate_name,
            resume_text=resume_text,
            username=username,
            repositories_summary=repos_summary,
            commit_activity_summary=commit_activity_summary
        )

        logger.info(f"Triggering Gemini evaluation for GitHub consistency check of {username}")
        max_retries = 3
        backoff_factor = 2
        attempt = 0
        parsed_result = None

        while attempt < max_retries:
            try:
                provider = LLMProviderFactory.get_provider()
                raw_response = await provider.generate_text(
                    prompt=prompt,
                    system_instruction=SYSTEM_INSTRUCTION
                )
                parsed_result = self._parse_json_response(raw_response)
                break
            except Exception as e:
                attempt += 1
                logger.warning(f"Gemini API check failed on attempt {attempt}: {str(e)}")
                if attempt >= max_retries:
                    raise RuntimeError(f"Failed to obtain valid LLM evaluation scores after {max_retries} attempts.") from e
                await asyncio.sleep(backoff_factor ** attempt)

        return parsed_result
