#!/usr/bin/env bash
set -euo pipefail

# Weekly backup verification for SprayKart.
# Cron: 0 4 * * 0 /home/ubuntu/spraykart/deployment/verify_backup.sh

BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
DB_USER="${DB_USER:-postgres}"
VERIFY_DB="${VERIFY_DB:-spraykart_verify}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"

send_result() {
  local subject="$1"
  local body="$2"
  if [[ -n "$ADMIN_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
    printf '%s\n' "$body" | mail -s "$subject" "$ADMIN_EMAIL"
  else
    printf '%s\n%s\n' "$subject" "$body"
  fi
}

cleanup() {
  sudo -u "$DB_USER" dropdb --if-exists "$VERIFY_DB" >/dev/null 2>&1 || true
}
trap cleanup EXIT

latest_backup="$(find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'spraykart_backup_*.sql.gz' -o -name 'spraykart_backup_*.sql' \) -printf '%T@ %p\n' | sort -nr | awk 'NR==1 {print $2}')"

if [[ -z "${latest_backup:-}" ]]; then
  send_result "[SprayKart] Backup verification FAILED" "No backup files found in $BACKUP_DIR"
  exit 1
fi

cleanup
sudo -u "$DB_USER" createdb "$VERIFY_DB"

if [[ "$latest_backup" == *.gz ]]; then
  gzip -dc "$latest_backup" | sudo -u "$DB_USER" psql -d "$VERIFY_DB" >/tmp/spraykart_verify_restore.log 2>&1
else
  sudo -u "$DB_USER" psql -d "$VERIFY_DB" < "$latest_backup" >/tmp/spraykart_verify_restore.log 2>&1
fi

counts="$(sudo -u "$DB_USER" psql -d "$VERIFY_DB" -t -A -F ',' <<'SQL'
SELECT
  (SELECT count(*) FROM products),
  (SELECT count(*) FROM orders),
  (SELECT count(*) FROM users);
SQL
)"

IFS=',' read -r products_count orders_count users_count <<< "$counts"
if (( products_count <= 0 || orders_count <= 0 || users_count <= 0 )); then
  send_result "[SprayKart] Backup verification FAILED" "Backup: $latest_backup
products=$products_count orders=$orders_count users=$users_count
Restore log: /tmp/spraykart_verify_restore.log"
  exit 1
fi

send_result "[SprayKart] Backup verification PASSED" "Backup: $latest_backup
products=$products_count orders=$orders_count users=$users_count
Temporary database $VERIFY_DB restored and dropped successfully."
