# AI-Powered HR Automation Platform

An automated recruitment workflow platform designed to streamline job description (JD) optimization, generate promotional social media assets, process candidate applications, and evaluate submissions using AI resume screening and GitHub/LinkedIn verification metrics.

---

## 1. Tech Stack

- **Backend**: FastAPI (Python 3.11+), Uvicorn, Pydantic Settings, SQLAlchemy 2.0 Async, Alembic Migrations
- **Frontend**: Next.js App Router (v16), TypeScript, Tailwind CSS, Axios client
- **Database**: PostgreSQL (v16)
- **Object Storage**: S3-Compatible Object Storage (MinIO)
- **AI Integrations**: Google Gemini (Primary Provider), Groq Llama 3 (Fallback Provider)
- **Testing**: Pytest, pytest-asyncio, pytest-env, HTTPX AsyncClient

---

## 2. Architecture Overview

The system employs a clean, modular layer architecture:
1. **API Router Layer (`backend/app/api/routes`)**: Thin endpoints handling parameters, schema validations, and HTTP mapping.
2. **Service Layer (`backend/app/services`)**: Business rules orchestration, S3 operations, text extraction, and score normalizations.
3. **Repository Layer (`backend/app/repositories`)**: Encapsulated database transactions and async SQLAlchemy queries.
4. **Database Models (`backend/app/models`)**: Declarative Base models for Postgres tables.
5. **LLM Gateway (`backend/app/llm`)**: Decoupled interface wrapping primary Gemini and backup Groq providers with error boundary failovers.

---

## 3. Local Setup Instructions

### Prerequisites
- Python 3.11
- Node.js 20
- Docker and Docker Compose

### Step 1: Clone and Set Up Environment Config
Copy the example variables file to `.env` in the root folder:
```bash
cp .env.example .env
```
Update any API keys inside `.env`.

### Step 2: Database and Object Storage Services
Start Postgres and MinIO containers:
```bash
docker compose up -d postgres minio
```

### Step 3: Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install uv
   uv pip install -e .[test]
   ```
3. Apply migrations:
   ```bash
   uv run alembic upgrade head
   ```
4. Run initial database seeding (HR recruiter user):
   ```bash
   uv run python -m app.scripts.seed_hr_user
   ```
5. Start development server:
   ```bash
   uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Step 4: Frontend Setup
1. Install node dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the Career Portal. Recruiter entrance is accessible via `/login` with credentials seeded inside `.env`.

---

## 4. Run Pytest Suite
To run all unit and integration tests under the isolated test database configuration:
```bash
cd backend
uv run python -m pytest -v -s
```

---

## 5. Dockerized Orchestration (Production Ready)
To build and start the entire app stack (Frontend, Backend, Postgres, MinIO) locally using Docker Compose:
```bash
# Validate compose configuration
docker compose config

# Build and start services in background
docker compose up --build -d

# View startup logs for migration and seed status
docker logs backend

# Shut down and cleanup resources
docker compose down
```

---

## 6. CI/CD Pipeline
The project implements automated checks inside `.github/workflows/ci.yml` verifying:
1. Backend code compilation.
2. Frontend package linting and builds.
3. Test suite completion under postgres service container contexts.
4. Docker build validation check for backend and frontend images.
