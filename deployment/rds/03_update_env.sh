#!/bin/bash
# ─── Step 3: Update .env on Lightsail after migration ──────────────────────
# Run ON YOUR LIGHTSAIL INSTANCE after 02_migrate_db.sh succeeds.

set -euo pipefail

# ── CONFIG — edit these ──────────────────────────────────────────────────────
RDS_HOST="<YOUR_RDS_ENDPOINT>"          # ← paste RDS endpoint
RDS_PORT="5432"
RDS_DB="spraykart"
RDS_USER="spraykart_user"
RDS_PASSWORD="CHANGE_THIS_STRONG_PASSWORD"
APP_DIR="/home/ubuntu/spraykart/frontend"  # ← adjust if different
# ─────────────────────────────────────────────────────────────────────────────

NEW_URL="postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}?sslmode=require"

ENV_FILE="${APP_DIR}/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env.local not found at $ENV_FILE"
  exit 1
fi

# Backup current env
cp "$ENV_FILE" "${ENV_FILE}.backup_$(date +%Y%m%d_%H%M%S)"
echo ">>> Backed up .env.local"

# Replace DATABASE_URL line
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${NEW_URL}|" "$ENV_FILE"
echo ">>> Updated DATABASE_URL in .env.local"

# Verify
echo ""
echo ">>> Current DATABASE_URL:"
grep "^DATABASE_URL=" "$ENV_FILE"

echo ""
echo ">>> Restarting app..."
cd "$APP_DIR" && pm2 restart all

echo ""
echo ">>> Done. Check app logs: pm2 logs --lines 50"
