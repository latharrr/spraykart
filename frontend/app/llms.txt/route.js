import db from '@/lib/db';
import logger from '@/lib/logger';
import { hasUsableDatabaseUrl, SITE_URL } from '@/lib/env';
import { FREE_SHIPPING_AT, SHIPPING_FEE } from '@/lib/shop';

export const revalidate = 3600;

// llms.txt: a plain-text map of the store for AI answer engines (https://llmstxt.org).
export async function GET() {
  let products = [];
  if (hasUsableDatabaseUrl()) {
    try {
      ({ rows: products } = await db.query(`
        SELECT name, slug, brand, category, price, scent_family
        FROM products WHERE is_active = true
        ORDER BY is_featured DESC, created_at DESC LIMIT 200
      `));
    } catch (err) {
      logger.warn('llms.txt products skipped:', err);
    }
  }

  const line = (p) => `- [${p.name}](${SITE_URL}/products/${p.slug}): ${[p.brand, p.category, p.scent_family, `₹${Number(p.price).toLocaleString('en-IN')}`].filter(Boolean).join(' · ')}`;

  const body = `# Spraykart

> Spraykart is an Indian online store for original designer perfumes, niche perfumes and attars. Every bottle is sourced as an original, batch-code checked and shipped with a GST invoice. Many fragrances are also sold as 10 ml decants.

## Departments
- [Designer perfumes](${SITE_URL}/products?tier=designer): fashion-house fragrances such as Dior, Chanel, Yves Saint Laurent and Versace
- [Niche perfumes](${SITE_URL}/products?tier=niche): independent perfumers such as Creed, Tom Ford and Maison Margiela
- [Attar](${SITE_URL}/products?category=Attar): alcohol-free perfume oils (ittar) such as oud, rose and musk
- [Gift sets](${SITE_URL}/products?category=Gift%20Sets): discovery sets and boxed fragrances
- [Fragrance finder](${SITE_URL}/fragrance-finder): a five-question quiz that shortlists fragrances

## Buying from Spraykart
- Delivery across India in 2 to 7 business days; free above ₹${FREE_SHIPPING_AT.toLocaleString('en-IN')}, otherwise ₹${SHIPPING_FEE}: ${SITE_URL}/shipping
- Payment by UPI, cards, net banking and wallets (Razorpay, Paytm), or cash on delivery on orders up to ₹2,999
- Damaged, defective or incorrect items must be reported within 48 hours of delivery; opened bottles cannot be returned for a change of mind: ${SITE_URL}/refund
- Questions: ${SITE_URL}/faq

## Fragrances
${products.map(line).join('\n') || `- [All fragrances](${SITE_URL}/products)`}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } });
}
