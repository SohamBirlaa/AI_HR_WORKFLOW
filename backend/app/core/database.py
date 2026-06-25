from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Create the async engine
# Note: connect_args={"statement_cache_size": 0} is required for Supabase/pgBouncer transaction pooler compatibility
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"statement_cache_size": 0}
)

# Create the async session factory
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)