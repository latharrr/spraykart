# SprayKart — Luxury Fragrances E-Commerce Platform

Production-ready Next.js 14 + PostgreSQL e-commerce application with Razorpay & Paytm payment integration.

## Quick Start

```bash
cd frontend
npm install
npm run build
npm start
```

## Environment Setup

```bash
# Core
JWT_SECRET=<32+ char secure key>
DATABASE_URL=postgresql://user:password@host:5432/spraykart
NODE_ENV=production

# Razorpay
RAZORPAY_KEY_ID=<key_id>
RAZORPAY_KEY_SECRET=<key_secret>
RAZORPAY_WEBHOOK_SECRET=<webhook_secret>

# Paytm (optional)
PAYTM_MID=<merchant_id>
PAYTM_MERCHANT_KEY=<merchant_key>
PAYTM_CALLBACK_URL=https://yourdomain.com/api/payments/paytm/callback
PAYTM_HOST=https://securegw.paytm.in  # Change to -stage for testing

# Email
RESEND_API_KEY=<resend_api_key>
EMAIL_FROM=Spraykart <noreply@yourdomain.com>
ADMIN_EMAIL=admin@yourdomain.com

# URLs
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Security
CRON_SECRET=<strong-random-secret>
```

## Database Setup

1. Apply migrations:
```bash
psql -U postgres -d spraykart < database/schema.sql
psql -U postgres -d spraykart < database/add_indexes.sql
psql -U postgres -d spraykart < database/migrations/001_*.sql
```

2. **Important**: Seed data uses placeholder bcrypt hashes. Reset admin password on first login:
```bash
node reset-and-verify.js
```

## Deployment Checklist

- [ ] All env vars configured (see above)
- [ ] Database migrations applied
- [ ] `npm run build` completes without errors
- [ ] Redis or cache configured (optional, falls back to in-process LRU)
- [ ] SSL/TLS certificate installed
- [ ] Razorpay webhook IP allowlisted
- [ ] Paytm callback URL whitelisted
- [ ] Admin email configured for alerts
- [ ] Cron secret set for `/api/cron/reconcile-orders`

## Key Features

- ✅ JWT authentication with session management
- ✅ Razorpay & Paytm payment integration
- ✅ Admin dashboard (products, orders, coupons, testimonials)
- ✅ Rate limiting on auth & checkout endpoints
- ✅ Webhook idempotency & dispute detection
- ✅ Coupon system with stock management
- ✅ Variant support (size, color, price modifiers)
- ✅ COD payment option (with ₹2,999 limit)
- ✅ Order reconciliation cron job
- ✅ Server-side cart validation

## Security Notes

- All payment webhooks are signature-verified (no IP allowlist).
- Coupon and stock changes are atomic within transactions.
- Password reset includes timing-attack mitigation (fixed delay).
- Cart prices are re-fetched server-side before coupon application.
- Admin order cancellation is blocked for online payments (prevents accidental refund misses).
- CSP headers restrict script and frame sources to payment gateways only.

## Troubleshooting

**Build fails with "ENOTFOUND postgres"**  
→ Sitemap and featured products fetch during static generation. Either:
1. Skip static generation by setting `DATABASE_URL=` during build, or
2. Provide a test DB connection with dummy data

**"jwt malformed" at login**  
→ JWT_SECRET not set or <32 characters. Check env vars.

**Webhook not updating order**  
→ Verify RAZORPAY_WEBHOOK_SECRET matches dashboard. Check webhook delivery logs.

**COD orders show as pending forever**  
→ Run the cron job: `curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/reconcile-orders`

## Support

Contact admin@spraykart.local for deployment questions.
