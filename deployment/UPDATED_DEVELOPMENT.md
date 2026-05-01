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
* **Admin UX:** Completely overhauled the Product Management UI, moving away from cramped modals to a full-featured `ProductForm` component with variant pricing, stock management, and Cloudinary image deletion sync.
* **Pricing Integrity:** Fixed discrepancy between cart `subtotal` and checkout logic to correctly include variant price modifiers, resolving Razorpay webhook rejections.
* **Security & Reliability:** Replaced hardcoded webhook IP allowlists with robust Razorpay Signature verification.
* **Data Integrity:** Prevented deletion of products that have active order items by implementing a `409 Conflict` check.
* **Data Integrity:** Fixed critical race conditions in product stock by implementing `FOR UPDATE` row-level locks for concurrent orders and cancellations, ensuring variant stock is correctly decremented and restored.
* **Data Integrity:** Fortified order creation idempotency using database-level `ON CONFLICT DO NOTHING` to prevent duplicate coupon decrementing.
* **Features:** Implemented a Refund Button in the Admin Orders UI directly integrating the Razorpay Refund API.
* **Security:** Rate-limited OTP attempts on the Forgot Password flow and restricted Cash on Delivery (COD) to orders under ₹2,999.
* **Features:** Added automatic Order Confirmation emails for COD orders.
* **UX/UI Optimization:** Replaced harsh `window.location.href` navigation with `useRouter` for seamless SPA transitions, and fixed Wishlist "Add to Cart" logic to handle variant selection.
* **Performance:** Optimized Admin Product List API to use a fetch-on-edit pattern, significantly speeding up the dashboard load time. Fixed React debouncing bug in Product Search by adopting `useRef`.
* **SEO & Analytics:** Added `revalidate` timers to `sitemap.js` and added environment tags to Sentry configuration for accurate monitoring.
* **Build System:** Fixed `serverExternalPackages` config in Next.js 14 and silenced `pg-cloudflare` warnings in webpack.

## SSL Renewal Smoke Test
Let's Encrypt renewal is automated by Certbot, but production should run a monthly dry-run and email on failure:

```bash
sudo certbot renew --dry-run
```

Suggested cron:

```bash
0 5 1 * * sudo certbot renew --dry-run >/tmp/spraykart_certbot_dry_run.log 2>&1 || cat /tmp/spraykart_certbot_dry_run.log | mail -s "[SprayKart] SSL renewal dry-run failed" "$ADMIN_EMAIL"
```
