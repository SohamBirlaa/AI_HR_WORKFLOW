import logging
from typing import Optional
from app.llm.base import BaseLLMProvider
from app.llm.exceptions import LLMTransientError, LLMProviderError

logger = logging.getLogger(__name__)

class LLMGateway(BaseLLMProvider):
    """LLM provider routing gateway implementing BaseLLMProvider.
    
    Coordinates resilient request dispatching by calling the configured primary
    provider first, and failing over to a fallback provider ONLY when encountering
    transient provider or connection failures.
    """

    def __init__(
        self,
        primary: BaseLLMProvider,
        fallback: Optional[BaseLLMProvider] = None,
        enable_fallback: bool = False
    ):
        """Initialize the gateway with primary and fallback providers.
        
        Args:
            primary: The default LLM provider.
            fallback: The backup LLM provider, called on primary transient failures.
            enable_fallback: Controls whether failover is active.
        """
        self.primary = primary
        self.fallback = fallback
        self.enable_fallback = enable_fallback

    async def generate_text(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> str:
        """Sends generateContent request to primary provider, with optional fallback routing."""
        try:
            return await self.primary.generate_text(prompt, system_instruction)
        except LLMTransientError as e:
            # Check if fallback routing is active and has a configured backend
            if self.enable_fallback:
                if not self.fallback:
                    logger.error(
                        f"LLM primary provider encountered a transient error: {str(e)}. "
                        "Fallback is enabled in settings, but the fallback provider is not configured (e.g. missing API key). "
                        "Aborting call without failover."
                    )
                    # Propagate the original primary error to prevent masking configuration issues
                    raise e

                logger.warning(
                    f"LLM primary provider encountered a transient error: {str(e)}. "
                    "Failing over to configured fallback provider..."
                )
                try:
                    return await self.fallback.generate_text(prompt, system_instruction)
                except Exception as fallback_err:
                    logger.exception(f"LLM fallback provider also failed: {str(fallback_err)}")
                    raise fallback_err
            else:
                # Fallback disabled; raise the original error immediately
                raise e
