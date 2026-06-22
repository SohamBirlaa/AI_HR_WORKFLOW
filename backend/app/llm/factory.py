from app.core.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.gemini import GeminiProvider

class LLMProviderFactory:
    """Factory layer retrieving active LLM provider configurations."""

    @staticmethod
    def get_provider() -> BaseLLMProvider:
        """Instantiates and returns the configured BaseLLMProvider implementation.

        Raises:
            ValueError: If the provider is unsupported or required configuration parameters are missing.
        """
        provider_name = settings.LLM_PROVIDER.lower()
        if provider_name == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not configured in settings.")
            return GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.GEMINI_MODEL,
                timeout=settings.LLM_TIMEOUT
            )
        else:
            raise ValueError(f"Unsupported LLM provider configured: {settings.LLM_PROVIDER}")
