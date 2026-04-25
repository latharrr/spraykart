#!/bin/bash
# automated database backup script for SprayKart
# Run via crontab: 0 3 * * * /home/ubuntu/spraykart/deployment/db_backup.sh

BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="spraykart"
DB_USER="postgres"
DATE=$(date +\%Y-\%m-\%d_\%H-\%M-\%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump database and compress
sudo -u "$DB_USER" pg_dump "$DB_NAME" | gzip > "$BACKUP_FILE"

# Keep only the last 7 days of backups
find "$BACKUP_DIR" -type f -name "${DB_NAME}_backup_*.sql.gz" -mtime +7 -exec rm {} \;

echo "Backup completed: $BACKUP_FILE"
