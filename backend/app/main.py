from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.job import router as job_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
)

# Set up CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Router prefixes
app.include_router(auth_router, prefix="/api/v1")
app.include_router(job_router, prefix="/api/v1")

# API v1 Health Check Endpoint
@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """Public unauthenticated route to verify backend status."""
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME
    }

