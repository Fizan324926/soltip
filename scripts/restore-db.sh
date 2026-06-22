#!/bin/bash
# SolTip Database Restore Script
# Usage: ./restore-db.sh <backup_file>
#
# Environment variables:
#   DATABASE_URL - PostgreSQL connection string (required)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ $# -lt 1 ]; then
    log_error "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    log_error "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Parse DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is required"
    exit 1
fi

url="${DATABASE_URL#postgres://}"
url="${url#postgresql://}"
PGUSER="${url%%:*}"
url="${url#*:}"
PGPASSWORD="${url%%@*}"
url="${url#*@}"
PGHOST="${url%%:*}"
url="${url#*:}"
PGPORT="${url%%/*}"
PGDATABASE="${url#*/}"
PGDATABASE="${PGDATABASE%%\?*}"
export PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE

log_info "=== SolTip Database Restore ==="
log_info "Database: ${PGDATABASE}"
log_info "Host: ${PGHOST}:${PGPORT}"
log_info "Backup: ${BACKUP_FILE}"

# Confirm
log_warn "WARNING: This will DROP and recreate all tables!"
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Restore
log_info "Starting restore..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    zcat "${BACKUP_FILE}" | psql --set ON_ERROR_STOP=on -q
else
    psql --set ON_ERROR_STOP=on -q < "${BACKUP_FILE}"
fi

log_info "=== Restore Complete ==="
