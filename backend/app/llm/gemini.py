import httpx
from typing import Optional
from app.llm.base import BaseLLMProvider

class GeminiProvider(BaseLLMProvider):
    """Gemini API wrapper implementing the BaseLLMProvider interface."""

    def __init__(self, api_key: str, model_name: str = "gemini-3.5-flash", timeout: float = 30.0):
        self.api_key = api_key
        self.model_name = model_name
        self.timeout = timeout
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

    async def generate_text(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> str:
        """Sends an async HTTP request to Gemini API and parses the response."""
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
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
                
                # Parse Gemini response object model structures
                candidates = data.get("candidates")
                if not candidates:
                    raise RuntimeError(f"Gemini returned no candidates: {data}")
                
                content = candidates[0].get("content")
                if not content:
                    raise RuntimeError(f"Gemini candidate returned no content: {data}")
                
                parts = content.get("parts")
                if not parts:
                    raise RuntimeError(f"Gemini content returned no parts: {data}")
                
                text = parts[0].get("text")
                if not text:
                    raise RuntimeError(f"Gemini part returned no text: {data}")
                
                return text
            except httpx.HTTPStatusError as e:
                detail = f"Gemini API returned status code {e.response.status_code}"
                try:
                    error_json = e.response.json()
                    detail += f": {error_json}"
                except Exception:
                    detail += f": {e.response.text}"
                raise RuntimeError(detail) from e
            except httpx.TimeoutException as e:
                raise TimeoutError("Gemini API request timed out") from e
            except Exception as e:
                raise RuntimeError(f"Unexpected error communicating with Gemini API: {str(e)}") from e
