import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('spraykart_errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    spraykart_errors: ['rate<0.01'],
  },
};

const BASE_URL = (__ENV.BASE_URL || __ENV.STAGING_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const PRODUCT_SLUG = __ENV.PRODUCT_SLUG || 'sample-product';

function record(response, label, allowStatuses = [200]) {
  const ok = check(response, {
    [`${label} status`]: (res) => allowStatuses.includes(res.status),
  });
  errorRate.add(!ok);
  return response;
}

export default function () {
  group('storefront', () => {
    record(http.get(`${BASE_URL}/`, { tags: { name: 'home' } }), 'home');
    record(http.get(`${BASE_URL}/products`, { tags: { name: 'products' } }), 'products');
    record(http.get(`${BASE_URL}/api/products`, { tags: { name: 'api-products' } }), 'api products');
    record(
      http.get(`${BASE_URL}/products/${PRODUCT_SLUG}`, { tags: { name: 'product-detail' } }),
      'product detail',
      [200, 404]
    );
  });

  sleep(1);
}
