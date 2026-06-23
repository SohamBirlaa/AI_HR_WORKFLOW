from abc import ABC, abstractmethod

class BaseScreeningQueue(ABC):
    """Abstract base class establishing the interface for enqueuing resume screening tasks.
    
    This design allows us to easily substitute different queue backends (e.g., FastAPI 
    BackgroundTasks, Celery, or Apache Kafka) in the future without changing the caller's code.
    """

    @abstractmethod
    async def enqueue_screening(self, application_id: int) -> None:
        """Enqueue a resume screening request for asynchronous execution.
        
        Args:
            application_id: The ID of the job application to screen.
        """
        pass
