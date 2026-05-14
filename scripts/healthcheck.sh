#!/bin/sh
set -eu

echo "=== Service Health Check ==="

# API health
if curl -sf http://localhost/health > /dev/null 2>&1; then
  echo "  [OK]  nginx/api  - /health endpoint reachable"
else
  echo "  [FAIL] nginx/api - /health endpoint unreachable"
  exit 1
fi

# PostgreSQL
if command -v pg_isready > /dev/null 2>&1; then
  DB_USER="${POSTGRES_USER:-portfolio_user}"
  DB_NAME="${POSTGRES_DB:-portfolio_db}"
  if pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    echo "  [OK]  postgres   - accepting connections"
  else
    echo "  [FAIL] postgres   - not accepting connections"
    exit 1
  fi
else
  echo "  [SKIP] postgres   - pg_isready not installed on host"
fi

# Redis
if command -v redis-cli > /dev/null 2>&1; then
  if redis-cli ping > /dev/null 2>&1; then
    echo "  [OK]  redis      - responding to ping"
  else
    echo "  [FAIL] redis      - not responding"
    exit 1
  fi
else
  echo "  [SKIP] redis      - redis-cli not installed on host"
fi

echo ""
echo "All checks passed."
