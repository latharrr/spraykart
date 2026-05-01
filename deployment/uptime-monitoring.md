# SprayKart Uptime Monitoring

Status: **Pending external monitor creation before go-live**

Create monitors in BetterStack, UptimeRobot, or Hetrix. Use BetterStack if Slack and SMS alerting are both available on the selected plan.

## Contacts

- Email: `ADMIN_EMAIL`
- SMS: primary admin phone
- Slack: production alerts channel

## Monitors

| Name | URL | Method | Expected | Interval | Timeout |
| --- | --- | --- | --- | --- | --- |
| SprayKart Home | `https://yourdomain.com/` | GET | HTTP 200 in <2s | 1 minute | 10 seconds |
| SprayKart Health | `https://yourdomain.com/api/health` | GET | HTTP 200, JSON `checks.db.status=connected` | 1 minute | 10 seconds |
| SprayKart Products | `https://yourdomain.com/products` | GET | HTTP 200 in <2s | 1 minute | 10 seconds |

## Health JSON Assertion

For `/api/health`, assert:

```json
{
  "checks": {
    "db": { "status": "connected" }
  }
}
```

Redis is also required for a 200 response from `/api/health`, but the DB assertion catches the highest-risk dependency explicitly.

## Alert Routing

- Email `ADMIN_EMAIL` immediately on failure.
- SMS primary admin immediately on failure.
- Slack production alerts channel immediately on failure.
- Escalate again if the incident is open for 5 minutes.
- Resolve notification on recovery.

## Launch Verification

- [ ] Home monitor created.
- [ ] Health monitor created with JSON assertion.
- [ ] Products monitor created.
- [ ] Test alert sent to email.
- [ ] Test alert sent to SMS.
- [ ] Test alert sent to Slack.
