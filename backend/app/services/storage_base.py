from abc import ABC, abstractmethod

class BaseStorageService(ABC):
    """Abstract Base Class specifying requirements for Storage Service implementations."""

    @abstractmethod
    def validate_resume_file(self, content: bytes, content_type: str) -> bool:
        """Inspect file magic bytes and Content-Type headers for validation."""
        pass

    @abstractmethod
    async def upload_resume(self, file_content: bytes, filename: str) -> str:
        """Upload raw resume file bytes and return a unique persistent identifier key."""
        pass

    @abstractmethod
    def get_resume_download_url(self, storage_key: str) -> str:
        """Fetch a temporary or direct retrieval link for a stored object."""
        pass
