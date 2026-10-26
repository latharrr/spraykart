import db from '@/lib/db';
import logger from '@/lib/logger';
import { hasUsableDatabaseUrl, SITE_URL } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap() {
  const base = SITE_URL;

  // Only canonical, publicly indexable URLs: no redirects (/privacy-policy etc.) and no account pages.
  const publicPages = [
    { path: '',                              priority: 1.0, freq: 'daily'   },
    { path: '/products',                     priority: 0.9, freq: 'daily'   },
    { path: '/products?tier=designer',       priority: 0.8, freq: 'daily'   },
    { path: '/products?tier=niche',          priority: 0.8, freq: 'daily'   },
    { path: '/products?category=Attar',      priority: 0.8, freq: 'daily'   },
    { path: '/products?category=Gift%20Sets', priority: 0.7, freq: 'weekly' },
    { path: '/products?category=Men',        priority: 0.7, freq: 'daily'   },
    { path: '/products?category=Women',      priority: 0.7, freq: 'daily'   },
    { path: '/products?category=Unisex',     priority: 0.6, freq: 'weekly'  },
    { path: '/fragrance-finder',             priority: 0.6, freq: 'monthly' },
    { path: '/faq',                          priority: 0.5, freq: 'monthly' },
    { path: '/machine',                      priority: 0.4, freq: 'monthly' },
    { path: '/contact',                      priority: 0.4, freq: 'monthly' },
    { path: '/shipping',                     priority: 0.3, freq: 'yearly'  },
    { path: '/refund',                       priority: 0.3, freq: 'yearly'  },
    { path: '/privacy',                      priority: 0.2, freq: 'yearly'  },
    { path: '/terms',                        priority: 0.2, freq: 'yearly'  },
  ];
  const staticPages = publicPages.map(({ path, priority, freq }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));

  if (!hasUsableDatabaseUrl()) return staticPages;

  let productPages = [];
  try {
    const { rows } = await db.query(
      // TODO: shard into sitemap-products-N.xml files when active products approach 5000.
      `SELECT p.slug, p.created_at,
         (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image
       FROM products p WHERE p.is_active = true ORDER BY p.created_at DESC LIMIT 5000`
    );
    productPages = rows.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
      ...(p.image ? { images: [p.image] } : {}),
    }));
  } catch (err) {
    logger.error('Sitemap products error:', err);
  }

  return [...staticPages, ...productPages];
}
