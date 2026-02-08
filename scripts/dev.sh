#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

USE_DOCKER_DB="${USE_DOCKER_DB:-0}"
DATABASE_URL="${DATABASE_URL:-}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-plataforma}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

if [ "$USE_DOCKER_DB" = "1" ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: USE_DOCKER_DB=1 but docker is not installed or not in PATH."
    exit 1
  fi

  if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
    export DATABASE_URL
    echo "Using generated DATABASE_URL for docker Postgres: $DATABASE_URL"
  fi

  echo "Starting postgres container (docker mode)..."
  docker compose up -d postgres

  echo "Waiting for postgres to become healthy..."
  for i in {1..30}; do
    health_status=$(docker inspect --format='{{.State.Health.Status}}' plataforma-postgres 2>/dev/null || true)

    if [ "$health_status" = "healthy" ]; then
      echo "Postgres is healthy."
      break
    fi

    sleep 2
  done

  final_health=$(docker inspect --format='{{.State.Health.Status}}' plataforma-postgres 2>/dev/null || true)
  if [ "$final_health" != "healthy" ]; then
    echo "Error: postgres container did not become healthy in time."
    docker compose ps postgres || true
    exit 1
  fi
elif [ -n "$DATABASE_URL" ]; then
  echo "Remote DB mode enabled (default). Docker compose will not be used."
else
  echo "Error: missing DATABASE_URL."
  echo "Set DATABASE_URL for remote Postgres (recommended), or set USE_DOCKER_DB=1 to run local Docker Postgres."
  echo "Tip: run npm run doctor for a full environment report."
  exit 1
fi

echo "Running doctor check before startup..."
npm run doctor

echo "Starting API and web apps..."
npm run dev:apps
