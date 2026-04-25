import db from '@/lib/db';

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
  try {
    const { rows } = await db.query(
      'SELECT slug, created_at FROM products WHERE is_active=true ORDER BY created_at DESC'
    );
    productPages = rows.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    console.error('Sitemap products error:', err);
  }

  return [...staticPages, ...productPages];
}
