import httpx
import asyncio
from typing import Optional
from app.llm.base import BaseLLMProvider
from app.llm.exceptions import (
    LLMProviderError,
    LLMTransientError,
    LLMValidationError,
    LLMAuthError
)

class GroqProvider(BaseLLMProvider):
    """Groq API wrapper implementing the BaseLLMProvider interface."""

    def __init__(self, api_key: str, model_name: str = "llama3-8b-8192", timeout: float = 30.0):
        """Initialize Groq connection settings.
        
        Args:
            api_key: The authentication token for the Groq API.
            model_name: The target Llama model footprint.
            timeout: The max wait threshold for completing calls.
        """
        self.api_key = api_key
        self.model_name = model_name
        self.timeout = timeout
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_text(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> str:
        """Sends an async HTTP request to Groq API and parses the response."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.1  # Enforce highly deterministic responses
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.url,
                    headers=headers,
                    json=payload,
                    timeout=self.timeout
                )
                response.raise_for_status()
                data = response.json()
                
                # Parse OpenAI-compatible structure
                choices = data.get("choices")
                if not choices:
                    raise RuntimeError(f"Groq API response missing 'choices': {data}")
                
                message = choices[0].get("message")
                if not message:
                    raise RuntimeError(f"Groq API choice missing 'message': {data}")
                
                text = message.get("content")
                if text is None:
                    raise RuntimeError(f"Groq API message content is null: {data}")
                
                return text
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                detail = f"Groq API returned status code {status_code}"
                try:
                    error_json = e.response.json()
                    detail += f": {error_json}"
                except Exception:
                    detail += f": {e.response.text}"

                if status_code in (429, 500, 502, 503, 504):
                    raise LLMTransientError(detail) from e
                elif status_code in (401, 403):
                    raise LLMAuthError(detail) from e
                elif status_code == 400:
                    raise LLMValidationError(detail) from e
                else:
                    raise LLMProviderError(detail) from e
            except (httpx.TimeoutException, TimeoutError, asyncio.TimeoutError) as e:
                raise LLMTransientError("Groq API request timed out") from e
            except httpx.RequestError as e:
                raise LLMTransientError(f"Groq API request connection failed: {str(e)}") from e
            except Exception as e:
                raise LLMProviderError(f"Unexpected error communicating with Groq API: {str(e)}") from e
