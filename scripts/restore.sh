#!/bin/bash
# ===========================================
# Sweden Vikings CMS - Database Restore Script
# ===========================================
# Usage: bash /opt/swedenvikings/scripts/restore.sh db_backup_20240101_030000.sql.gz

set -e

PROJECT_DIR="/opt/swedenvikings"
BACKUP_DIR="/opt/swedenvikings/backups"

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file is a path or just filename
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "===========================================
Sweden Vikings CMS - Database Restore
==========================================="

cd "$PROJECT_DIR"

echo "WARNING: This will REPLACE all data in the database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop app container to prevent writes during restore
echo ">>> Stopping app container..."
docker compose -f docker-compose.prod.yml stop app

# Restore database
echo ">>> Restoring database..."
gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d swedenvikings

# Start app container
echo ">>> Starting app container..."
docker compose -f docker-compose.prod.yml start app

echo "
===========================================
Restore Complete!
===========================================
"

