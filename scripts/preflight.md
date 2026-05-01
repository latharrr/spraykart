# Production Payment Smoke Test Checklist

This checklist must be run against production with LIVE payment keys before go-live and before any payment-related deploy.

Status: PENDING
Last run at: YYYY-MM-DD HH:mm IST
Runner:
Domain:

## Razorpay LIVE

- [ ] Place INR 1 order using Razorpay LIVE keys.
- [ ] Verify payment appears in Razorpay dashboard.
- [ ] Verify settlement appears or is queued in Razorpay dashboard.
- [ ] Trigger refund for the INR 1 Razorpay order.
- [ ] Verify refund webhook fires.
- [ ] Verify Spraykart order/refund status updates correctly.

## Paytm LIVE

- [ ] Place INR 1 order using Paytm LIVE keys.
- [ ] Verify payment appears in Paytm dashboard.
- [ ] Verify settlement appears or is queued in Paytm dashboard.
- [ ] Trigger refund for the INR 1 Paytm order.
- [ ] Verify refund webhook fires.
- [ ] Verify Spraykart order/refund status updates correctly.

## Webhook Cutover

- [ ] Razorpay webhook URL points to production, not ngrok/local tunnel.
- [ ] Paytm callback/webhook URL points to production, not ngrok/local tunnel.
- [ ] Webhook secrets in production match dashboard configuration.
- [ ] Production logs show no signature failure for the smoke-test payments.

## Completion Rule

Change `Status: PENDING` to `Status: PASS` only after every row above is checked. The deploy gate also requires this file to have been modified within the last 24 hours.

Note: the original checklist requested `SCRIPTS/preflight.md`; this repository already has a tracked `scripts/` directory and the current Windows workspace cannot distinguish `SCRIPTS` from `scripts`, so the deploy gate uses this file path.
