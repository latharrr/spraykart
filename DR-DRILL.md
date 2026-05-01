# SprayKart Disaster Recovery Drill

Status: **Pending production SSH execution before go-live**

Required frequency: once before launch, then quarterly.

Run date:

Operator:

Production host:

Backup selected:

Start time:

End time:

Total restore time:

## Drill Steps

1. SSH into the production Lightsail instance.
2. Pick a random backup from `/home/ubuntu/backups/`.
3. Restore it into a temporary database named `spraykart_drill`.
4. Verify product list, order count, and latest user.
5. Drop `spraykart_drill`.
6. Record time taken, errors, and missing documentation below.

## Commands

```bash
cd /home/ubuntu/spraykart

BACKUP="$(find /home/ubuntu/backups -name '*.sql.gz' -type f | shuf -n 1)"
echo "Using backup: $BACKUP"

sudo -u postgres dropdb --if-exists spraykart_drill
sudo -u postgres createdb -O spraykart_admin spraykart_drill
zcat "$BACKUP" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d spraykart_drill

sudo -u postgres psql -d spraykart_drill -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*) AS products_count FROM products;
SELECT count(*) AS orders_count FROM orders;
SELECT count(*) AS users_count FROM users;
SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 1;
SQL

sudo -u postgres dropdb --if-exists spraykart_drill
```

## Acceptance Criteria

- [ ] Restore completes without SQL errors.
- [ ] `products_count` is greater than 0.
- [ ] `orders_count` is greater than 0.
- [ ] `users_count` is greater than 0.
- [ ] Latest user query returns a plausible recent user.
- [ ] Temporary database is dropped.
- [ ] Any doc mismatch is fixed in `deployment/AWS_DEVOPS_HANDOVER.md`.

## Result

Not executed from this workstation because production SSH access is not available in the coding environment. This file is ready for the pre-launch drill and the restore commands have been mirrored into the handover doc.
