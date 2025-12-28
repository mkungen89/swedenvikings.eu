#!/bin/bash
# ===========================================
# Sweden Vikings CMS - Database Backup Script
# ===========================================
# Usage: bash /opt/swedenvikings/scripts/backup.sh
# Add to crontab for automatic backups:
# 0 3 * * * /opt/swedenvikings/scripts/backup.sh

set -e

PROJECT_DIR="/opt/swedenvikings"
BACKUP_DIR="/opt/swedenvikings/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "===========================================
Sweden Vikings CMS - Database Backup
==========================================="

cd "$PROJECT_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables for DB password
source .env.production 2>/dev/null || true

# Backup database
echo ">>> Creating database backup..."
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres swedenvikings | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Backup uploads folder
echo ">>> Creating uploads backup..."
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C "$PROJECT_DIR" uploads

# Remove old backups
echo ">>> Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete

# List current backups
echo ">>> Current backups:"
ls -lh "$BACKUP_DIR"

echo "
===========================================
Backup Complete!
Files saved to: $BACKUP_DIR
===========================================
"

