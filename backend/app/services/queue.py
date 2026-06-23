import logging
from fastapi import BackgroundTasks
from app.services.queue_base import BaseScreeningQueue
from app.core.database import async_session_maker

logger = logging.getLogger(__name__)

class BackgroundTaskScreeningQueue(BaseScreeningQueue):
    """Enqueues resume screening tasks to run asynchronously in FastAPI's BackgroundTasks queue."""

    def __init__(self, background_tasks: BackgroundTasks):
        """Initialize queue with request-scoped background tasks handler."""
        self.background_tasks = background_tasks

    async def enqueue_screening(self, application_id: int) -> None:
        """Add the screening function call to the FastAPI request background tasks.
        
        Args:
            application_id: The ID of the application to screen.
        """
        async def run_screening(app_id: int):
            # Dynamic import to avoid circular dependency loop with services
            from app.services.screening import ScreeningService
            
            # Since background tasks execute outside the request lifecycle,
            # we open a separate database transaction session to ensure safety.
            async with async_session_maker() as db:
                try:
                    service = ScreeningService(db)
                    await service.screen_candidate(app_id)
                except Exception as e:
                    logger.exception(f"Unhandled error in background screening task for application {app_id}: {str(e)}")
                finally:
                    await db.close()

        logger.info(f"Enqueuing resume screening background task for application {application_id}")
        self.background_tasks.add_task(run_screening, application_id)
