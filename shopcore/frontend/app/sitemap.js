export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';

  const staticPages = ['', '/products', '/cart', '/checkout', '/orders', '/account'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1.0 : 0.8,
  }));

  let productPages = [];
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/products?limit=1000`);
    const { products } = await res.json();
    productPages = (products || []).map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {}

  return [...staticPages, ...productPages];
}
