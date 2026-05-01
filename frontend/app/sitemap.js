import db from '@/lib/db';
import logger from '@/lib/logger';
import { hasUsableDatabaseUrl } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://spraykart.vercel.app';

  const staticPages = ['', '/products', '/cart', '/checkout', '/orders', '/account'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1.0 : 0.8,
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
