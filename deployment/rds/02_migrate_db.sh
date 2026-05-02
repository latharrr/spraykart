#!/bin/bash
# ─── Step 2: Migrate Local PostgreSQL → AWS RDS ────────────────────────────
# Run this ON YOUR LIGHTSAIL INSTANCE (SSH in first).
# Prerequisites:
#   - RDS instance is in 'available' status (run 01_create_rds.sh first)
#   - postgresql-client installed: sudo apt install postgresql-client -y

set -euo pipefail

# ── CONFIG — edit these ──────────────────────────────────────────────────────
LOCAL_DB="spraykart"                    # local DB name
LOCAL_USER="postgres"                   # local DB user
RDS_HOST="<YOUR_RDS_ENDPOINT>"          # ← paste RDS endpoint here
RDS_PORT="5432"
RDS_DB="spraykart"
RDS_USER="spraykart_user"
RDS_PASSWORD="CHANGE_THIS_STRONG_PASSWORD"   # ← same as 01_create_rds.sh
DUMP_FILE="/tmp/spraykart_$(date +%Y%m%d_%H%M%S).dump"
# ─────────────────────────────────────────────────────────────────────────────

echo ">>> Step 1/4: Dumping local PostgreSQL database..."
sudo -u postgres pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --verbose \
  "$LOCAL_DB" > "$DUMP_FILE"

echo ">>> Dump saved to: $DUMP_FILE"
echo ">>> Dump size: $(du -sh $DUMP_FILE | cut -f1)"

echo ""
echo ">>> Step 2/4: Testing RDS connection..."
PGPASSWORD="$RDS_PASSWORD" psql \
  --host="$RDS_HOST" \
  --port="$RDS_PORT" \
  --username="$RDS_USER" \
  --dbname="$RDS_DB" \
  --command="SELECT version();"

echo ""
echo ">>> Step 3/4: Restoring dump to RDS..."
PGPASSWORD="$RDS_PASSWORD" pg_restore \
  --host="$RDS_HOST" \
  --port="$RDS_PORT" \
  --username="$RDS_USER" \
  --dbname="$RDS_DB" \
  --no-owner \
  --no-acl \
  --verbose \
  --exit-on-error \
  "$DUMP_FILE"

echo ""
echo ">>> Step 4/4: Verifying row counts..."
echo "--- Local DB ---"
sudo -u postgres psql -d "$LOCAL_DB" -c "
  SELECT
    'users' AS table_name, COUNT(*) FROM users
  UNION ALL SELECT 'products', COUNT(*) FROM products
  UNION ALL SELECT 'orders', COUNT(*) FROM orders
  UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
  UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;
"

echo ""
echo "--- RDS ---"
PGPASSWORD="$RDS_PASSWORD" psql \
  --host="$RDS_HOST" \
  --port="$RDS_PORT" \
  --username="$RDS_USER" \
  --dbname="$RDS_DB" \
  --command="
  SELECT
    'users' AS table_name, COUNT(*) FROM users
  UNION ALL SELECT 'products', COUNT(*) FROM products
  UNION ALL SELECT 'orders', COUNT(*) FROM orders
  UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
  UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;
"

echo ""
echo ">>> ✓ Migration complete! Counts should match above."
echo ""
echo ">>> NEXT STEPS:"
echo "  1. Compare row counts above — they must match"
echo "  2. Update .env.local on this server:"
echo "     DATABASE_URL=postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}?sslmode=require"
echo "  3. Run: pm2 restart all"
echo "  4. Test the site thoroughly"
echo "  5. Only after confirming everything works: drop local DB (optional)"
echo ""
echo ">>> Dump file kept at $DUMP_FILE — delete when done: rm $DUMP_FILE"
