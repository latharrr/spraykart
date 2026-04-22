import { notFound } from 'next/navigation';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ReviewSection from '@/components/product/ReviewSection';
import db from '@/lib/db';
import cache from '@/lib/cache';

async function getProduct(slug) {
  const cacheKey = `product:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Run both queries in parallel:
  // Query 1 — product + images + variants collapsed into a single JSON-aggregated query
  // Query 2 — reviews (independent of images/variants, can run simultaneously)
  const [productRes, reviewsRes] = await Promise.all([
    db.query(`
      SELECT p.*,
        COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) as avg_rating,
        COUNT(DISTINCT r.id)                       as review_count,
        COALESCE(
          json_agg(DISTINCT pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) as images,
        COALESCE(
          json_agg(DISTINCT v.*) FILTER (WHERE v.id IS NOT NULL), '[]'
        ) as variants
      FROM products p
      LEFT JOIN reviews       r  ON r.product_id  = p.id AND r.is_approved = true
      LEFT JOIN product_images pi ON pi.product_id = p.id
      LEFT JOIN variants       v  ON v.product_id  = p.id
      WHERE p.slug = $1 AND p.is_active = true
      GROUP BY p.id
    `, [slug]),

    db.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = (
        SELECT id FROM products WHERE slug = $1 AND is_active = true LIMIT 1
      ) AND r.is_approved = true
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [slug]),
  ]);

  if (!productRes.rows.length) return null;

  // Sort images by sort_order (JSON agg doesn't guarantee order)
  const product = productRes.rows[0];
  product.images = (product.images || []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  product.reviews = reviewsRes.rows;

  await cache.set(cacheKey, product, 300);
  return product;
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return {};
  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.description?.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.substring(0, 160),
      images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avg_rating,
        reviewCount: product.review_count,
      },
    }),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductGallery images={product.images} />
        <ProductInfo product={product} />
      </div>
      <ReviewSection product={product} reviews={product.reviews} />
    </div>
  );
}
