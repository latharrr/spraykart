# SprayKart Development & Readiness Log

This document tracks the completed tasks from the Production Readiness Checklist and outlines what is currently being worked on.

## ✅ Completed Updates
* **Security:** Deleted backdoor `/api/setup-admin/route.js`.
* **Performance:** Created and applied `database/add_indexes.sql` to optimize Razorpay webhooks and queries.
* **Monitoring:** Integrated `@sentry/nextjs` and `instrumentation.js` for error tracking, optimizing the build for a 1GB AWS Lightsail instance.
* **Data Integrity:** Created `deployment/db_backup.sh` and scheduled automated daily database backups.
* **Security:** Implemented Redis-backed Rate Limiting on `/api/auth/login`, `/register`, `/forgot-password`, and `/apply-coupon`.
* **Data Integrity:** Added Stock-Restore logic to automatically refund product inventory when an admin cancels an order, or when `payment.failed` webhook fires, or when the 30-min pending timeout cron fires.
* **Data Integrity:** Added coupon `used_count` decrement logic upon order cancellation.
* **Data Integrity:** Created `/api/cron/reconcile-orders` endpoint to be hit via cron to automatically cancel abandoned `pending` orders older than 30 minutes. Also added a cleanup job for expired password reset tokens.
* **Features:** Added "Free Shipping" capability to Coupons, fully integrated into the Admin UI and Checkout logic.
* **Features:** Added Refund API endpoint at `/api/admin/orders/[id]/refund` to allow admins to issue Razorpay refunds directly.
* **Features:** Added Cash on Delivery (COD) payment method to the checkout flow and updated the database schema.
* **Security:** Added strict `Content-Security-Policy` headers to `next.config.js`.
* **Security:** Added Razorpay Webhook IP Allowlist checks.
* **Security:** Added strict `JWT_SECRET` length validation on server boot.
* **Security:** Implemented strict password validation (min 8 chars, uppercase, number, special character) for new registrations and password resets.
* **Security:** Implemented session invalidation (cookie clearing) upon successful password reset.
* **Documentation:** Added detailed Database Restore instructions to `AWS_DEVOPS_HANDOVER.md`.
* **Performance:** Sized PostgreSQL connection pool (`max: 5`) perfectly for the 1GB RAM instance and added index on `password_resets`.
