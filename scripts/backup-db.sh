#!/bin/sh
set -eu

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_USER="${POSTGRES_USER:-portfolio_user}"
DB_NAME="${POSTGRES_DB:-portfolio_db}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

echo "Backing up database '${DB_NAME}' to ${BACKUP_FILE}..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-acl \
  > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
echo "Done: ${BACKUP_FILE}.gz"
