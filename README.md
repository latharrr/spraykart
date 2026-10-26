# SprayKart

Storefront and admin for an Indian online perfume retailer: designer and niche fragrances, attars, 10 ml decants and a discovery set, paid by Razorpay, Paytm or cash on delivery. Next.js 14 on PostgreSQL, built solo by [Deepanshu Lathar](https://deepanshulathar.com).

![CI](https://github.com/latharrr/spraykart/actions/workflows/ci.yml/badge.svg)

| At a glance | |
|---|---|
| **Status** | Pre-launch. Built and load-tested; the manual QA run and the disaster-recovery drill have not been done ([QA-CHECKLIST.md](QA-CHECKLIST.md), [DR-DRILL.md](DR-DRILL.md)). |
| **Stack** | Next.js 14 (App Router), React 18, Tailwind, PostgreSQL (`pg`), optional Redis, Zustand |
| **Payments** | Razorpay, Paytm, COD (up to INR 2,999) |
| **Ops** | Sentry, PM2 + Nginx handover doc, health endpoints, reconcile cron |
| **My role** | Product, frontend, backend, schema, payments, deployment scripts |

## What it does

**Shopper side**
- Catalogue with brand, scent family, top/heart/base notes, longevity, sillage, season and occasion; size variants with price modifiers.
- Fragrance Finder, a five-question quiz that suggests scents.
- Cart validated on the server, coupons with product scoping, wishlist, order history, per-order GST invoice PDF.
- Email/password accounts, OTP password reset, reviews, contact form.

**Admin side** (`/admin`)
- Products, orders, coupons, reviews, testimonials, FAQs, homepage assets, users, audit log, webhook events and metrics.
- A paid online order cannot be cancelled until refunds cover the full amount; products with order history are deactivated, not deleted.

## How the risky parts are handled

- **Payments.** Razorpay and Paytm webhooks are signature-verified, stored in a `webhook_events` table with idempotency, and a failed event keeps its status, last error and retry count. A cron route (`/api/cron/reconcile-orders`) cancels pending orders older than 30 minutes.
- **Stock and coupons.** Reservation, coupon use and stock changes run inside one transaction, so a cancelled order restores both.
- **Cart prices** are re-read from the database before a coupon applies; the client never sets a price.
- **Abuse.** Rate limits on auth and checkout, CSRF checks, a CSP that only allows the payment gateways, and a fixed delay on password reset to blunt timing probes.
- **Email** goes through a job queue (`email_jobs`) with a worker route, so a mail outage does not fail checkout.

## Architecture

```
frontend/            Next.js app: pages in app/, API routes in app/api/, shared code in lib/
  app/api/           auth, orders, payments (Razorpay/Paytm), webhooks, cron, admin/*, health
  lib/               db, auth, csrf, rateLimit, invoice, webhookProcessors, email jobs, logger
database/            schema.sql, add_indexes.sql, migrations/001-024
deployment/          deploy.sh, PM2 config, Nginx/Lightsail handover, backup + restore scripts, Sentry budget
scripts/             k6 load test and results, Lighthouse, payment preflight checklist
```

## Run it locally

Needs Node 20+ and PostgreSQL.

```bash
createdb spraykart
psql -d spraykart < database/schema.sql
psql -d spraykart < database/add_indexes.sql
for f in database/migrations/*.sql; do psql -d spraykart < "$f"; done

cd frontend
npm install
cp .env.local.example .env.local   # then fill in the variables below
npm run dev        # http://localhost:3000
```

`database/seed.sql` is optional sample data. Its admin row carries a placeholder password hash, and the helper script it mentions is no longer in this repo, so insert your own admin user with a bcrypt hash and do not load that row into anything public.

<details>
<summary>Environment variables (names only)</summary>

| Group | Variables |
|---|---|
| Core | `DATABASE_URL`, `JWT_SECRET` (32+ chars), `NODE_ENV`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET` |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Paytm (optional) | `PAYTM_MID`, `PAYTM_MERCHANT_KEY`, `PAYTM_CALLBACK_URL`, `PAYTM_HOST` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` |
| Monitoring | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |
| Invoices | `BUSINESS_NAME`, `BUSINESS_ADDRESS`, `BUSINESS_EMAIL`, `BUSINESS_PHONE`, `BUSINESS_GSTIN`, `BUSINESS_STATE`, `BUSINESS_HSN_DEFAULT` |
| Shipping | `FREE_SHIPPING_THRESHOLD` (default 999) |

Never commit real values. The build reads the database for the sitemap and featured products; set `DATABASE_URL=` empty to skip that, or point it at a test database.
</details>

## Checks

- CI runs ESLint and a production build on every push and pull request (`.github/workflows/ci.yml`).
- A k6 load test ran on 1 May 2026 against an earlier Vercel deployment: 50 virtual users for 2 minutes, 0 failed requests, p95 835 ms ([scripts/loadtest-results.md](scripts/loadtest-results.md)). It covered browse and product pages only, not checkout.
- There is no automated test suite for checkout or the payment webhooks yet.

## Known gaps

- Real-money payments have not been run end to end; `deployment/predeploy_check.sh` blocks a deploy until `scripts/preflight.md` is marked PASS with every row checked.
- Manual QA ([QA-CHECKLIST.md](QA-CHECKLIST.md)) and the restore drill ([DR-DRILL.md](DR-DRILL.md)) are open.
- Legal pages and invoices show placeholders until the business name, address and GSTIN variables are set.
- Deployment notes and the change history are in [deployment/UPDATED_DEVELOPMENT.md](deployment/UPDATED_DEVELOPMENT.md) and [deployment/AWS_DEVOPS_HANDOVER.md](deployment/AWS_DEVOPS_HANDOVER.md). A `jwt malformed` error at login usually means `JWT_SECRET` is missing or shorter than 32 characters.

## Author

Deepanshu Lathar - https://deepanshulathar.com - [@latharrr](https://github.com/latharrr)
