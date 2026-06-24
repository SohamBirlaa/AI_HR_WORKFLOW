import logging
from app.core.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.gemini import GeminiProvider
from app.llm.groq import GroqProvider
from app.llm.gateway import LLMGateway

logger = logging.getLogger(__name__)

class LLMProviderFactory:
    """Factory layer retrieving active LLM provider configurations."""

    @staticmethod
    def get_provider() -> BaseLLMProvider:
        """Instantiates and returns the configured BaseLLMProvider implementation wrapped in LLMGateway.

        Raises:
            ValueError: If the primary provider is unsupported or missing config.
        """
        # 1. Instantiate Primary LLM Provider
        provider_name = settings.LLM_PROVIDER.lower()
        if provider_name == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not configured in settings.")
            primary = GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.GEMINI_MODEL,
                timeout=settings.LLM_TIMEOUT
            )
        elif provider_name == "groq":
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY is not configured in settings.")
            primary = GroqProvider(
                api_key=settings.GROQ_API_KEY,
                model_name=settings.GROQ_MODEL,
                timeout=settings.LLM_TIMEOUT
            )
        else:
            raise ValueError(f"Unsupported LLM provider configured: {settings.LLM_PROVIDER}")

        # 2. Instantiate Fallback LLM Provider (if enabled)
        fallback = None
        if settings.LLM_ENABLE_FALLBACK:
            fallback_name = settings.LLM_FALLBACK_PROVIDER.lower()
            if fallback_name == "groq":
                if settings.GROQ_API_KEY:
                    fallback = GroqProvider(
                        api_key=settings.GROQ_API_KEY,
                        model_name=settings.GROQ_MODEL,
                        timeout=settings.LLM_TIMEOUT
                    )
                else:
                    logger.warning("LLM Fallback is enabled to Groq, but GROQ_API_KEY is missing. Fallback will not be active.")
            elif fallback_name == "gemini":
                if settings.GEMINI_API_KEY:
                    fallback = GeminiProvider(
                        api_key=settings.GEMINI_API_KEY,
                        model_name=settings.GEMINI_MODEL,
                        timeout=settings.LLM_TIMEOUT
                    )
                else:
                    logger.warning("LLM Fallback is enabled to Gemini, but GEMINI_API_KEY is missing. Fallback will not be active.")
            else:
                logger.warning(f"Unsupported LLM fallback provider configured: {settings.LLM_FALLBACK_PROVIDER}")

        # 3. Wrap both inside the gateway
        return LLMGateway(
            primary=primary,
            fallback=fallback,
            enable_fallback=settings.LLM_ENABLE_FALLBACK
        )
