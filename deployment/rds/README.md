# RDS Migration Guide

Moves PostgreSQL from the Lightsail instance → AWS RDS Free Tier (db.t2.micro).

## Why

- DB and app on the same instance means one crash loses everything
- RDS has automated daily backups (7-day retention) at no extra cost
- Free tier: 750 hrs/month db.t2.micro + 20GB storage (12 months)

## Prerequisites

- AWS CLI installed & configured locally (`aws configure`)
- SSH access to Lightsail instance
- `postgresql-client` on Lightsail (`sudo apt install postgresql-client -y`)

## Steps

### 1. Create RDS instance (run locally)

```bash
# Edit DB_PASSWORD in the script first!
chmod +x deployment/rds/01_create_rds.sh
./deployment/rds/01_create_rds.sh
```

Wait 5–10 min, then get the endpoint:

```bash
aws rds describe-db-instances \
  --db-instance-identifier spraykart-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region ap-south-1
```

### 2. Migrate data (run on Lightsail via SSH)

```bash
# Copy script to server
scp deployment/rds/02_migrate_db.sh ubuntu@65.0.239.246:~/

# SSH in
ssh ubuntu@65.0.239.246

# Edit RDS_HOST and RDS_PASSWORD in the script, then:
chmod +x ~/02_migrate_db.sh
~/02_migrate_db.sh
```

Verify row counts match at the end of the script output.

### 3. Update app env (run on Lightsail)

```bash
# Edit RDS_HOST, RDS_PASSWORD, APP_DIR in the script, then:
chmod +x ~/03_update_env.sh
~/03_update_env.sh
```

### 4. Verify

- Check `pm2 logs --lines 100` for any DB connection errors
- Open the site and test: login, browse products, place a test order
- Check `/api/health` → should return `{"status":"ok"}`

### 5. Update db_backup.sh

Point `db_backup.sh` to dump from RDS instead of local:

```bash
# Old:
sudo -u postgres pg_dump spraykart > ...

# New:
PGPASSWORD="$RDS_PASSWORD" pg_dump \
  --host="$RDS_HOST" \
  --username="$RDS_USER" \
  spraykart > ...
```

## Rollback

If anything goes wrong, revert `DATABASE_URL` in `.env.local` to the old local connection and `pm2 restart all`. The local DB is untouched until you manually drop it.

## Cost

- Free for 12 months (750 hrs/month db.t2.micro)
- After 12 months: ~$15/month — reassess then

## Files

| File | Purpose |
|------|---------|
| `01_create_rds.sh` | Provision RDS instance via AWS CLI |
| `02_migrate_db.sh` | Dump local DB, restore to RDS, verify counts |
| `03_update_env.sh` | Update `.env.local` and restart PM2 |
