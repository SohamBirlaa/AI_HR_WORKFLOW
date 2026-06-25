import pytest
from httpx import AsyncClient
from app.core.security import get_password_hash
from app.models.user import User

@pytest.fixture
async def seed_test_user(db_session):
    """Seed a default active HR admin user into the test database."""
    hashed_pw = get_password_hash("admin123")
    user = User(
        email="admin@company.com",
        hashed_password=hashed_pw,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

async def test_health_check(async_client: AsyncClient):
    """Verify public health endpoint returns correct status code and information."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "project" in data

async def test_login_success(async_client: AsyncClient, seed_test_user):
    """Verify auth login works with valid seeded credentials."""
    login_payload = {
        "email": "admin@company.com",
        "password": "admin123"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

async def test_login_invalid_password(async_client: AsyncClient, seed_test_user):
    """Verify auth login fails with bad credentials."""
    login_payload = {
        "email": "admin@company.com",
        "password": "wrongpassword"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

async def test_login_invalid_email(async_client: AsyncClient, seed_test_user):
    """Verify auth login fails with a non-existent email address."""
    login_payload = {
        "email": "nonexistent@company.com",
        "password": "admin123"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

async def test_login_validation_error(async_client: AsyncClient):
    """Verify auth login rejects malformed input (invalid email structure)."""
    login_payload = {
        "email": "invalid-email-format",
        "password": "admin123"
    }
    response = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 422

async def test_protected_route_unauthorized(async_client: AsyncClient):
    """Verify private dashboard calls reject access when auth headers are missing."""
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

async def test_protected_route_invalid_token(async_client: AsyncClient):
    """Verify private dashboard calls reject access when using incorrect JWT tokens."""
    headers = {"Authorization": "Bearer invalid_token_bytes"}
    response = await async_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

async def test_protected_route_authorized(async_client: AsyncClient, seed_test_user):
    """Verify private dashboard calls succeed when passing a valid JWT bearer token."""
    # Obtain a valid token first
    login_payload = {
        "email": "admin@company.com",
        "password": "admin123"
    }
    login_res = await async_client.post("/api/v1/auth/login", json=login_payload)
    token = login_res.json()["access_token"]
    
    # Access the /me profile endpoint using token
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == seed_test_user.email
    assert user_data["id"] == seed_test_user.id
