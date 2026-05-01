# SprayKart Sentry Error Budget Alerts

Status: **Pending Sentry project alert configuration before go-live**

Set these rules in Sentry for the production project. Alert recipients should page the admin via email, SMS, and Slack.

## Required Rules

### Unique Error Spike

- Trigger: more than 10 unique errors in 5 minutes.
- Environment: `production`.
- Action: page admin.
- Suggested Sentry rule: issue count grouped by unique issue, 5-minute window, threshold `> 10`.

### Checkout Error Rate

- Trigger: more than 5% checkout error rate.
- Environment: `production`.
- Filter: transaction or route contains `/checkout`, `/api/orders`, `/api/payments/create`, `/api/payments/verify`, `/api/payments/paytm/create`.
- Action: page admin.
- Implementation note: use Sentry performance/error-rate alert if transactions are enabled; otherwise create issue alerts for checkout/payment route tags until transaction telemetry is available.

### Payment Signature Failure

- Trigger: any payment webhook signature failure where `payment_event_type=payment.captured`.
- Environment: `production`.
- Filter tags:
  - `alert_type=payment_webhook_signature_failure`
  - `payment_event_type=payment.captured`
  - `failure_type=signature.invalid` or `failure_type=signature.missing`
- Action: page admin immediately.

The webhook handlers capture these Sentry events without attaching webhook payloads. The payload stays in the redacted DLQ tables for admin retry/debugging.

## Launch Verification

- [ ] Unique error spike alert created.
- [ ] Checkout error-rate alert created.
- [ ] Payment signature failure alert created.
- [ ] Test notification delivered to email.
- [ ] Test notification delivered to SMS.
- [ ] Test notification delivered to Slack.
