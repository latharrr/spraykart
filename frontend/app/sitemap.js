import db from '@/lib/db';
import logger from '@/lib/logger';
import { hasUsableDatabaseUrl, SITE_URL } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap() {
  const base = SITE_URL;

  // Only include publicly-indexable pages. Authenticated/account pages are
  // excluded so they don't show up as crawlable in search results.
  const publicPages = [
    { path: '',                  priority: 1.0,  freq: 'daily'   },
    { path: '/products',         priority: 0.9,  freq: 'daily'   },
    { path: '/fragrance-finder', priority: 0.7,  freq: 'monthly' },
    { path: '/contact',          priority: 0.5,  freq: 'monthly' },
    { path: '/faq',              priority: 0.5,  freq: 'monthly' },
    { path: '/privacy-policy',   priority: 0.3,  freq: 'yearly'  },
    { path: '/terms',            priority: 0.3,  freq: 'yearly'  },
    { path: '/refund-policy',    priority: 0.3,  freq: 'yearly'  },
    { path: '/shipping-policy',  priority: 0.3,  freq: 'yearly'  },
  ];
  const staticPages = publicPages.map(({ path, priority, freq }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));

  let productPages = [];
  if (!hasUsableDatabaseUrl()) {
    return staticPages;
  }

  try {
    const { rows } = await db.query(
      // TODO: shard into sitemap-products-N.xml files when active products approach 5000.
      'SELECT slug, created_at FROM products WHERE is_active=true ORDER BY created_at DESC LIMIT 5000'
    );
    productPages = rows.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    logger.error('Sitemap products error:', err);
  }

  return [...staticPages, ...productPages];
}
