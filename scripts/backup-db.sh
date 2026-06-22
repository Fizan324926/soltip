#!/bin/bash
# SolTip Database Backup Script
# Usage: ./backup-db.sh [backup_dir]
#
# Environment variables:
#   DATABASE_URL - PostgreSQL connection string (required)
#   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 30)
#   S3_BUCKET - Optional S3 bucket for remote backup
#   AWS_REGION - AWS region for S3 (default: us-east-1)

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-/var/backups/soltip}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="soltip_backup_${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required tools
check_requirements() {
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Install postgresql-client."
        exit 1
    fi

    if ! command -v gzip &> /dev/null; then
        log_error "gzip not found. Install gzip."
        exit 1
    fi
}

# Parse DATABASE_URL
parse_db_url() {
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi

    # Extract components from postgres://user:pass@host:port/dbname
    local url="${DATABASE_URL#postgres://}"
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
}

# Create backup
create_backup() {
    log_info "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"

    log_info "Starting backup of database: ${PGDATABASE}"
    log_info "Host: ${PGHOST}:${PGPORT}"

    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"

    pg_dump \
        --format=plain \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > "${backup_path}"

    local size=$(du -h "${backup_path}" | cut -f1)
    log_info "Backup created: ${backup_path} (${size})"

    # Create latest symlink
    ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/latest.sql.gz"

    echo "${backup_path}"
}

# Upload to S3 (optional)
upload_to_s3() {
    local backup_path="$1"

    if [ -z "${S3_BUCKET:-}" ]; then
        log_info "S3_BUCKET not set, skipping S3 upload"
        return
    fi

    if ! command -v aws &> /dev/null; then
        log_warn "AWS CLI not found, skipping S3 upload"
        return
    fi

    local region="${AWS_REGION:-us-east-1}"
    local s3_path="s3://${S3_BUCKET}/backups/${BACKUP_FILE}"

    log_info "Uploading to S3: ${s3_path}"
    aws s3 cp "${backup_path}" "${s3_path}" --region "${region}"
    log_info "S3 upload complete"
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning backups older than ${RETENTION_DAYS} days"

    local deleted=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted++))
    done < <(find "${BACKUP_DIR}" -name "soltip_backup_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print0 2>/dev/null || true)

    if [ $deleted -gt 0 ]; then
        log_info "Deleted ${deleted} old backup(s)"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_path="$1"

    log_info "Verifying backup integrity..."

    if ! gzip -t "${backup_path}" 2>/dev/null; then
        log_error "Backup file is corrupted!"
        exit 1
    fi

    local line_count=$(zcat "${backup_path}" | wc -l)
    if [ "$line_count" -lt 10 ]; then
        log_error "Backup appears to be empty or too small (${line_count} lines)"
        exit 1
    fi

    log_info "Backup verified: ${line_count} lines"
}

# Main
main() {
    log_info "=== SolTip Database Backup ==="
    log_info "Timestamp: ${TIMESTAMP}"

    check_requirements
    parse_db_url

    local backup_path
    backup_path=$(create_backup)

    verify_backup "${backup_path}"
    upload_to_s3 "${backup_path}"
    cleanup_old_backups

    log_info "=== Backup Complete ==="
}

main "$@"
