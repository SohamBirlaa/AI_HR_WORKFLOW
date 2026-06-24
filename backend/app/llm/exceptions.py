class LLMProviderError(Exception):
    """Base class for all exceptions raised by LLM providers."""
    pass

class LLMTransientError(LLMProviderError):
    """Raised when the LLM provider experiences a transient, retryable error.
    
    Includes API rate limiting (429), timeouts, and 5xx server errors
    (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout).
    """
    pass

class LLMValidationError(LLMProviderError):
    """Raised when request validation fails.
    
    Includes bad requests (400), prompt structure, or safety settings blocks.
    These are not transient and should not trigger fallback.
    """
    pass

class LLMAuthError(LLMProviderError):
    """Raised for authentication or permission problems.
    
    Includes invalid API key or access denied (401/403).
    These are configuration issues and should not trigger fallback.
    """
    pass
