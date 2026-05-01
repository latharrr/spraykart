# SprayKart Load Test Results

Run date: 2026-05-01

Tool: k6 v1.7.1, downloaded locally from the official Grafana k6 GitHub release.

Target used from `NEXT_PUBLIC_SITE_URL`: `https://spraykart.vercel.app`

Command:

```bash
k6 run -e BASE_URL=https://spraykart.vercel.app -e PRODUCT_SLUG=dior-sauvage-edp scripts/loadtest.js
```

Profile:

- Ramp 0 to 50 virtual users over 30 seconds.
- Hold 50 virtual users for 2 minutes.
- Ramp down over 20 seconds.
- Endpoints: `/`, `/products`, `/products/dior-sauvage-edp`, `/api/products`.

Results:

- Checks: 11,772 passed, 0 failed.
- Error rate: 0.00%.
- HTTP failed requests: 0.00%.
- p95 latency: 834.58ms.
- Average latency: 373.55ms.
- Max latency: 10.83s.

Status: **FAILED performance threshold**.

Pass criteria were error rate <1%, no 5xx, and p95 <800ms. Error criteria passed, but p95 exceeded the 800ms threshold by 34.58ms. Re-run after optimizing slow product/catalog responses and after moving the final target to the Lightsail staging/prod host.
