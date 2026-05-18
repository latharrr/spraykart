import { SITE_URL } from '@/lib/env';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/checkout', '/cart', '/account', '/orders', '/wishlist'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
