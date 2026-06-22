# Database Backup & Recovery

## Overview

SolTip includes scripts for automated PostgreSQL backups with optional S3 upload.

## Quick Start

### Manual Backup

```bash
# Set your database URL
export DATABASE_URL="postgres://user:pass@localhost:5432/soltip"

# Run backup
./scripts/backup-db.sh /var/backups/soltip
```

### Automated Backups (Cron)

Add to crontab (`crontab -e`):

```bash
# Daily backup at 3 AM
0 3 * * * DATABASE_URL="postgres://user:pass@localhost:5432/soltip" /path/to/soltip/scripts/backup-db.sh /var/backups/soltip >> /var/log/soltip-backup.log 2>&1

# Weekly backup to S3 on Sundays at 4 AM
0 4 * * 0 DATABASE_URL="..." S3_BUCKET="my-backups" /path/to/scripts/backup-db.sh /var/backups/soltip >> /var/log/soltip-backup.log 2>&1
```

### Docker Compose Backup Service

Add to `docker-compose.yml`:

```yaml
services:
  backup:
    image: postgres:16
    environment:
      - DATABASE_URL=postgres://soltip:${POSTGRES_PASSWORD}@db:5432/soltip
      - BACKUP_RETENTION_DAYS=30
    volumes:
      - ./scripts:/scripts:ro
      - backups:/var/backups/soltip
    entrypoint: /bin/bash
    command: >
      -c 'while true; do
        /scripts/backup-db.sh /var/backups/soltip;
        sleep 86400;
      done'
    depends_on:
      - db

volumes:
  backups:
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `BACKUP_RETENTION_DAYS` | No | 30 | Days to keep local backups |
| `S3_BUCKET` | No | - | S3 bucket for remote backup |
| `AWS_REGION` | No | us-east-1 | AWS region |

### S3 Upload

To enable S3 uploads:

1. Install AWS CLI: `pip install awscli`
2. Configure credentials: `aws configure`
3. Set the S3 bucket:
   ```bash
   export S3_BUCKET="my-soltip-backups"
   ```

## Restoration

### From Local Backup

```bash
export DATABASE_URL="postgres://user:pass@localhost:5432/soltip"

# Restore latest backup
./scripts/restore-db.sh /var/backups/soltip/latest.sql.gz

# Or specific backup
./scripts/restore-db.sh /var/backups/soltip/soltip_backup_20240115_030000.sql.gz
```

### From S3

```bash
# Download backup
aws s3 cp s3://my-backups/backups/soltip_backup_20240115_030000.sql.gz .

# Restore
./scripts/restore-db.sh soltip_backup_20240115_030000.sql.gz
```

## Backup Contents

Each backup includes:
- All tables (profiles, tips, goals, subscriptions, etc.)
- Sequences and indexes
- Does NOT include: roles, permissions (for portability)

## Monitoring

### Check Recent Backups

```bash
ls -la /var/backups/soltip/
```

### Verify Backup Integrity

```bash
gzip -t /var/backups/soltip/latest.sql.gz && echo "OK"
```

### Check Backup Size

```bash
du -sh /var/backups/soltip/*.sql.gz
```

## Best Practices

1. **Test restores regularly** - Don't wait for a disaster to verify backups work
2. **Use S3 or off-site storage** - Local backups alone aren't disaster recovery
3. **Monitor backup jobs** - Set up alerts if backups fail
4. **Encrypt sensitive backups** - Use `gpg` or S3 server-side encryption
5. **Keep multiple copies** - Different retention policies for daily/weekly/monthly

## Point-in-Time Recovery (PITR)

For production deployments requiring PITR, consider:

1. **AWS RDS** - Automated backups with PITR
2. **WAL-G** - Continuous archiving to S3
3. **pgBackRest** - Enterprise backup solution

### WAL-G Setup (Advanced)

```bash
# Install wal-g
wget https://github.com/wal-g/wal-g/releases/download/v2.0.1/wal-g-pg-ubuntu-20.04-amd64.tar.gz
tar -xzf wal-g-*.tar.gz && mv wal-g-* /usr/local/bin/wal-g

# Configure in postgresql.conf
archive_mode = on
archive_command = 'wal-g wal-push %p'

# Set environment
export WALG_S3_PREFIX=s3://my-bucket/wal-g
export AWS_REGION=us-east-1
```

## Troubleshooting

### "pg_dump: command not found"

Install PostgreSQL client:
```bash
# Ubuntu/Debian
apt-get install postgresql-client

# macOS
brew install postgresql
```

### "connection refused"

Check database is accessible:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### "permission denied"

Ensure backup directory is writable:
```bash
mkdir -p /var/backups/soltip
chown $(whoami) /var/backups/soltip
```
