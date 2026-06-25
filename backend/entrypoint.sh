#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Parse host and port from DATABASE_URL. Defaults to postgres:5432
DB_HOST="postgres"
DB_PORT="5432"

echo "Waiting for PostgreSQL database port on ${DB_HOST}:${DB_PORT}..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "PostgreSQL port is active."

echo "Running Alembic migrations..."
alembic upgrade head

echo "Running database seeding..."
python -m app.scripts.seed_hr_user

echo "Starting Uvicorn production server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
