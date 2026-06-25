# AI-Powered HR Automation Platform

An enterprise-ready, automated recruitment workflow platform designed to streamline job posting lifecycles, optimize job descriptions using AI, generate multi-channel social media assets, process candidate submissions with file validation and consent checks, and perform asynchronous AI-assisted resume screening alongside GitHub footprint analysis and manual LinkedIn evaluations.

> 🚧 Assignment Completed
> ✅ Production-Oriented Foundation
> 🚀 Designed to evolve into a SaaS HR Automation Platform

---

## 1. Project Overview

The **AI-Powered HR Automation Platform** is a full-stack web application that simplifies the recruitment lifecycle for HR recruiters and applicants:
* **For Recruiters**: Provides a secure HR Dashboard to create, publish, and manage job postings, generate and review social media campaign assets, run automatic GitHub footprint consistency audits, input manual LinkedIn assessments, and view normalized combined candidate evaluations.
* **For Candidates**: Provides a public job board listing active vacancies, detailed vacancy pages, and a secure application portal featuring structured resume uploads, consent verification, and automatic background evaluation.

---

## 2. Screenshots

<!-- TODO: Add high-resolution product walkthrough screenshots and video demonstrations here -->
<!-- 
- Recruiter Login Page: ![Recruiter Login Placeholder](https://via.placeholder.com/800x450.png?text=Recruiter+Login+Portal) 
- Job Post & JD Generator Dashboard: ![JD Generator Placeholder](https://via.placeholder.com/800x450.png?text=Job+Description+AI+Polish+Dashboard)
- Social Asset Preview & Clipboard Actions: ![Social Asset Placeholder](https://via.placeholder.com/800x450.png?text=Social+Media+Asset+Promotion+Deck)
- Candidate Vacancy Catalog & Application Board: ![Public Portal Placeholder](https://via.placeholder.com/800x450.png?text=Public+Job+Board+and+Apply+Portal)
- Recruiter Applicant Master-Detail & Combined Metrics: ![Applicant Review Dashboard Placeholder](https://via.placeholder.com/800x450.png?text=Recruiter+Applicant+Master-Detail+Review)
-->

---

## 3. Key Features

* **HR Recruiter Dashboard**: A secure interface for managing job posts, social promotions, and screening results.
* **Job Creation & Lifecycle**: Supports drafts, AI-polishing, HR approval, publication, and catalog updates.
* **LLM-Powered JD Polishing**: Leverages Google Gemini with structured output validation, input delimiters, and an 800-word constraint budget.
* **Social Media Content Generation**: Automatically produces platform-specific social assets (LinkedIn, Twitter/X, Facebook, Instagram) with copy-to-clipboard functionality and X character limit validation.
* **Public Job Listing & Candidate Application Portal**: Public vacancy pages allowing candidates to view vacancies and apply.
* **Secure Resume Upload & Magic Bytes Validation**: Restricts uploads to PDF and DOCX under 10MB using file structure MIME and magic bytes headers verification.
* **Candidate Consent Enforcement**: Enforces candidate data usage consent at the service layer, instantly rejecting creation if not granted.
* **Asynchronous AI Screening Engine**: Extracts text from resumes using PyMuPDF and python-docx, scoring candidates on Skills, Experience, and Education using Google Gemini without blocking user requests.
* **Recruiter-Triggered GitHub Consistency Check**: Pulls public candidate repository data and uses AI to verify experience consistency.
* **Manual LinkedIn Assessment & Combined Scoring**: Normalizes candidate scores dynamically using weight redistributions when LinkedIn/GitHub sections are pending:
  $$\text{CV Match (70%)} + \text{GitHub Check (15%)} + \text{LinkedIn Review (15%)} = 100\%$$
* **JWT Authentication**: Secure stateless login using HTTP-only cookies and cryptographic verification.
* **Dockerized Deployment**: Clean containerization utilizing multi-stage Docker builds, bridge networking, health checks, and connection wait-loops.
* **Automated Test Suite**: Unit and integration tests validating database schema isolation, route boundaries, file validation, and LLM gate failovers.
* **GitHub Actions CI/CD**: Automatic pipeline executing checks on code compilation, linter guidelines, test pass state, and Docker builds.

---

## 4. Tech Stack

* **Frontend**: Next.js App Router (v16), TypeScript, Tailwind CSS, Axios
* **Backend**: FastAPI, Uvicorn, Pydantic (Settings & Schemas), SQLAlchemy 2.0 (Async Engine), Alembic Migrations
* **Database**: PostgreSQL 16 (Alpine)
* **Storage**: S3-Compatible Object Storage (MinIO)
* **AI / LLM**: Google Gemini (Primary), Groq Llama 3 (Fallback)
* **Testing**: Pytest, pytest-asyncio, pytest-env, HTTPX AsyncClient
* **DevOps**: Docker, Docker Compose, GitHub Actions CI

---

## 5. Architecture & Design Principles

The backend is structured as a decoupled, clean-layered architecture:
```mermaid
graph TD
    Client[Next.js Client] -->|HTTP Request| API[API Routes app/api/routes]
    API -->|Dependency Injection| Services[Services Layer app/services]
    Services -->|Entities| Repositories[Repositories app/repositories]
    Repositories -->|Queries| DB[(PostgreSQL)]
    Services -->|File Upload| S3[(MinIO Object Storage)]
    Services -->|AI Prompts| LLM[LLM Gateway / Fallback]
```

### Core Design Principles
* **Clean Architecture**: Strong boundary isolation between external dependencies (web framework, databases, storage systems, AI APIs) and internal business domain rules.
* **Separation of Concerns**: Division between HTTP route mappings (`app/api/`), business service logic (`app/services/`), raw query transactions (`app/repositories/`), and data definitions (`app/models/`).
* **Dependency Injection**: Leverage FastAPI `Depends` variables to inject scoped database sessions, storage connections, and task queues, keeping integrations mockable.
* **Testability**: Decoupled structures enabling comprehensive test coverage through simple fixture overrides.
* **Production Readiness**: Resilient configuration loading using Pydantic, standalone Next.js builds, connection retries, and optional environment loading.

---

## 6. Project Structure

```txt
AI_HR_WORKFLOW/
├── .github/workflows/       # GitHub Actions CI pipelines
│   └── ci.yml
├── backend/
│   ├── alembic/              # DB migration versions
│   ├── app/
│   │   ├── api/              # HTTP routers & dependency injections
│   │   ├── core/             # Base configurations & settings
│   │   ├── llm/              # Decoupled LLM Gateway & Providers
│   │   ├── models/           # Declarative database entities
│   │   ├── repositories/     # Async SQL repositories
│   │   ├── schemas/          # Pydantic validation structures
│   │   ├── scripts/          # Database seed utilities
│   │   └── services/         # Business logic & AI scoring engines
│   ├── tests/                # Automated pytest suite
│   ├── Dockerfile            # Multi-stage Python runner
│   ├── entrypoint.sh         # Connection wait-loops & migrations
│   └── pyproject.toml        # Backend dependencies & package definitions
├── frontend/
│   ├── app/                  # Next.js App Router files
│   ├── components/           # Reusable UI controls
│   ├── Dockerfile            # Next.js standalone runner
│   ├── package.json          # Node dependencies & package definitions
│   └── next.config.ts        # Next standalone configurations
├── docker-compose.yml        # Multi-container orchestration configurations
└── .env.example              # Environment variables template
```

---

## 7. Environment Variables

Local configuration is managed using a root `.env` file. A template with placeholders is provided in `.env.example`:
```bash
# --- Backend Config ---
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_hr
JWT_SECRET=your_jwt_cryptographic_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# --- LLM Providers ---
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash

# --- LLM Fallback Providers ---
LLM_ENABLE_FALLBACK=true
LLM_FALLBACK_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# --- S3 / MinIO Object Storage ---
STORAGE_PROVIDER=s3
S3_ENDPOINT_URL=http://localhost:9000
S3_PUBLIC_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=ai-hr-resumes
S3_REGION=us-east-1

# --- Seeding Defaults ---
INITIAL_ADMIN_EMAIL=admin@company.com
INITIAL_ADMIN_PASSWORD=admin123
```

---

## 8. Local Development Setup

### Prerequisites
* Python 3.11
* Node.js 20
* Docker & Docker Compose

### Step 1: Services Setup
Start the localized database and MinIO storage systems in the background:
```bash
docker compose up -d postgres minio
```

### Step 2: Backend Setup
1. Navigate to backend directory and initialize the virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
2. Install package manager and dependencies:
   ```bash
   pip install uv
   uv pip install -e .[test]
   ```
3. Run migrations and seed the default HR recruiter:
   ```bash
   uv run alembic upgrade head
   uv run python -m app.scripts.seed_hr_user
   ```
4. Start the FastAPI backend application server:
   ```bash
   uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Step 3: Frontend Setup
1. Navigate to the frontend directory and install node packages:
   ```bash
   cd ../frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to access the application.

---

## 9. Docker Compose Deployment (Production-Ready)

To build and orchestrate all four containers (PostgreSQL, MinIO, Backend, Frontend) under a unified isolated network:

```bash
# Validate Docker Compose config file
docker compose config

# Build and start all services
docker compose up --build -d

# Inspect backend connection wait checks and auto-seeding log status
docker logs backend

# Stop stack and clean volumes
docker compose down
```

---

## 10. Production Cloud Deployment (Vercel + Railway + AWS S3)

The application is prepared for seamless production cloud deployments across **Vercel** (Frontend client), **Railway** (Backend web service and PostgreSQL database), and **AWS S3** (Resume file storage).

### Deployment Environment Variables

#### Backend (Railway Service)
* `DATABASE_URL`: `postgresql+asyncpg://<user>:<password>@<host>:<port>/<dbname>` (Automatically provided by Railway database bindings)
* `PORT`: Dynamically injected by Railway (Backend automatically binds Uvicorn to `0.0.0.0:${PORT}`)
* `JWT_SECRET`: Random secure string for encryption signatures
* `BACKEND_CORS_ORIGINS`: JSON array of allowed origins (e.g. `["https://your-app.vercel.app"]`)
* `STORAGE_PROVIDER`: `s3`
* `S3_ENDPOINT_URL`: `https://s3.<region>.amazonaws.com` (or empty for default AWS S3 endpoint resolution)
* `S3_PUBLIC_ENDPOINT_URL`: `https://s3.<region>.amazonaws.com` (Used for browser-facing presigned resume downloads)
* `S3_ACCESS_KEY` & `S3_SECRET_KEY`: AWS IAM User credentials with S3 read/write permissions
* `S3_BUCKET_NAME`: Target AWS S3 bucket name (e.g., `ai-hr-resumes-prod`)
* `S3_REGION`: Target AWS S3 Region (e.g., `us-east-1`)
* `GEMINI_API_KEY`: Google AI studio key for resume screening and JD rewriting
* `GROQ_API_KEY`: Groq API key for LLM gateway fallback resilience (optional)
* `MOCK_GITHUB`: `False` (for live candidate GitHub repository footprint verification checks)

#### Frontend (Vercel)
* `NEXT_PUBLIC_API_URL`: `https://<your-railway-app-url>/api/v1`

---

## 11. Testing Strategy & Operations

### Testing Strategy
The platform follows a three-layered verification layout to maintain regression resistance:
1. **Mock Layer Isolation**: Tests do not connect to external APIs (Gemini, Groq, GitHub) or live S3 storage buckets. Instead, we use clean stub overrides (`MockLLMProvider`, `S3StorageService` stub configurations, and mock document extractors) in `tests/conftest.py`.
2. **Database Clean Isolation**: Tests are mapped onto an isolated schema engine running in `ai_hr_test`. Tables are created from scratch and dropped after each test execution to avoid transaction leakage.
3. **Synchronous Task Execution**: Background screening queues are overridden in tests to execute synchronously, ensuring screening logic, weights, and scoring distributions complete before assertions run.

### Running Tests Locally
```bash
# Compile backend code to check syntax
cd backend
uv run python -m compileall app

# Execute backend unit/integration tests
uv run python -m pytest -v

# Lint frontend files
cd ../frontend
npm run lint

# Compile frontend build
npm run build
```

---

## 12. CI/CD Integration (GitHub Actions)

A self-contained testing pipeline is declared in `.github/workflows/ci.yml`. It runs automatically on push/pull requests to verify code integrity:
1. **Backend Checks**: Launches a PostgreSQL service container inside the runner, installs dependencies, compiles backend code, and runs the Pytest suite.
2. **Frontend Checks**: Configures Node.js, installs npm dependencies, validates ESLint specifications, and builds Next.js.
3. **Docker Build Verification**: Runs compose config and builds backend and frontend images to verify Dockerfile validity.

---

## 13. API Overview

* **Authentication (`/api/v1/auth`)**:
  * `POST /login`: Logs in the recruiter, issuing a JWT access token via cookies.
  * `GET /me`: Returns details of the logged-in user.
* **Jobs Management (`/api/v1/jobs`)**:
  * `POST /`: Creates a draft job post.
  * `POST /{id}/polish`: Polishes job description using Gemini.
  * `POST /{id}/approve`: Approves the polished job description.
  * `POST /{id}/publish`: Publishes the job post to the catalog.
* **Public Vacancies (`/api/v1/public`)**:
  * `GET /jobs`: Lists published jobs (supports title, description, and company filtering).
  * `GET /jobs/{id}`: Returns vacancy page details.
  * `POST /jobs/{id}/apply`: Submits application, uploads resume to S3, and enqueues async AI screening.
* **Application Review (`/api/v1/applications`)**:
  * `GET /jobs/{id}/applications`: Lists candidates for a vacancy.
  * `POST /{id}/github-check`: Triggered manually by HR to perform AI analysis on candidate repository footprints.
  * `POST /{id}/linkedin-assessment`: HR inputs ratings and notes for the candidate's LinkedIn profile.

---

## 14. Security Notes

* **JWT Verification**: Recruiter routes are secured using JWT signatures.
* **Consent Verification**: Submissions are strictly block-rejected at the service layer if candidate consent flags are not checked.
* **Magic Bytes Validation**: Restricts resume extensions to PDF/DOCX and validates magic byte structures in file headers, protecting against upload spoofing.
* **Environment Protection**: `.env` configuration files are explicitly ignored by Git. No real production secrets, credentials, or API keys are committed in the repository.
* **Safe Defaults**: Standard local configurations fallback to safe developer overrides. Recruiter credentials should be customized via environment settings prior to staging/production runs.

---

## 15. Assignment Scope vs Product Roadmap

### Completed for Assignment
- **Dual-Track Seeding**: Safe seeding mechanism preventing password logging with development defaults.
- **Testing Suite**: Pytest validation covering auth, vacancy workflows, consent checks, duplicate rejections, and weight redistributions.
- **Dockerization**: Orchestrated database startup check loops, volume mounts, and Next.js standalone packaging.
- **CI Pipeline**: Self-contained build validation routines running inside GitHub Actions environment.

### Future SaaS Roadmap
- **Multi-Tenancy**: Isolated database schemas or row-level logical separation for multiple organizations.
- **Advanced RBAC**: Multiple workspace permissions (Owner, Editor, Read-only Recruiter, Reviewer).
- **Security Audit Logs**: Track recruiters' changes on candidate ratings and application reviews.
- **Distributed Queue**: Migrate background tasks to Redis and Celery for highly scalable job screening processing.
- **Recruiter Analytics Dashboard**: Interactive analytics showing funnel conversions, time-to-hire, and pipeline metrics.
- **ATS Integrations**: Support syncs with external systems like Workday, Greenhouse, and Lever.
- **Subscribed Billing**: Organize plans and payment methods using Stripe integrations.
- **Monitoring & Observability**: Integrated tracing using Prometheus and Grafana for server performance.

---

## 16. Future Improvements
* **Advanced Resume Parsing**: Shift from simple text-extraction to structured JSON layout analysis.
* **Real-time screening notifications**: Notify candidates and recruiters via email/SMS immediately on status transitions.
* **Dynamic Weight Adjustment Dashboard**: A UI component allowing recruiters to custom-adjust screening weights per job role.

---

## 17. Contributing
This repository is an assignment codebase and currently not accepting external pull requests. For suggestions or architectural questions, please contact the author directly.

---

## 18. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 19. Acknowledgements
* The Google Gemini team for providing structured JSON schema AI extraction guides.
* The Next.js team for providing standalone multi-stage docker configurations.
* The SQLAlchemy developers for providing state-of-the-art async session structures.

---

## 20. Author

* **Soham Birla**
* AI/ML & Full-Stack Developer
* Delhi, India
