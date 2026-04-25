# SprayKart Development & Readiness Log

This document tracks the completed tasks from the Production Readiness Checklist and outlines what is currently being worked on.

## ✅ Completed Updates
* **Security:** Deleted backdoor `/api/setup-admin/route.js`.
* **Performance:** Created and applied `database/add_indexes.sql` to optimize Razorpay webhooks and queries.
* **Monitoring:** Integrated `@sentry/nextjs` and `instrumentation.js` for error tracking, optimizing the build for a 1GB AWS Lightsail instance.
* **Data Integrity:** Created `deployment/db_backup.sh` and scheduled automated daily database backups.
* **Security:** Implemented Redis-backed Rate Limiting on `/api/auth/login` (Max 5 attempts / 15 mins).
* **Data Integrity:** Added Stock-Restore logic to automatically refund product inventory when an admin cancels an order.
* **Features:** Added "Free Shipping" capability to Coupons, fully integrated into the Admin UI and Checkout logic.

## 🚧 Currently In Progress (Next Batch)
We are currently tackling the next set of **Critical Security Blockers**:
1. Expanding Rate Limiting to `/register`, `/forgot-password`, and `/apply-coupon`.
2. Adding Content-Security-Policy (CSP) headers in `next.config.js`.
3. Adding Webhook IP Validation to ensure Razorpay webhooks cannot be spoofed.
4. Adding `JWT_SECRET` length validation on server boot to prevent weak keys.
