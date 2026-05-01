# SprayKart Manual QA Checklist

Status: **Pending production/staging execution before go-live**

Run date:

Tester:

Target URL:

Evidence folder/link:

> Do not deploy until every row is checked with evidence. Payment rows must use the configured Razorpay/Paytm test or live smoke credentials requested for the launch gate.

- [ ] Register new user -> email arrives.
- [ ] Login -> dashboard accessible.
- [ ] Forgot password -> OTP arrives -> reset works -> old session invalidated.
- [ ] Browse products -> filters work -> search matches name AND description.
- [ ] Add to cart -> variant pricing correct -> coupon applies -> cart persists across reload.
- [ ] Checkout COD -> order confirmed instantly -> email arrives.
- [ ] Checkout Razorpay test -> payment success -> webhook fires -> status updates.
- [ ] Checkout Paytm test -> payment success -> webhook fires -> status updates.
- [ ] Cancel pending order -> stock restored -> coupon `used_count` decremented.
- [ ] Admin: cancel confirmed paid online order -> blocked until full refund coverage exists.
- [ ] Admin: issue partial refund -> recorded -> original cancellation remains blocked until cumulative refunds cover the full paid amount.
- [ ] Admin: delete product with order history -> 409.
- [ ] Admin: deactivate product instead -> succeeds.
- [ ] Mobile real device, not emulator -> all flows work, no horizontal scroll.
- [ ] Slow 3G throttle -> site usable, skeletons show.
- [ ] Logout -> cookies cleared -> admin pages redirect to login.

## Notes

- Partial-refund behavior is intentionally stricter than the original QA row: cancellation of a paid online order requires full refund coverage, so a single partial refund should be recorded but should not unlock cancellation unless it covers the full order amount.
- Record order IDs, payment IDs, webhook event IDs, and screenshots for payment, refund, and admin flows.
