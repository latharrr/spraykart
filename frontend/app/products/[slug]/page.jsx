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

  const { rows } = await db.query(`
    SELECT p.*,
      COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) as avg_rating,
      COUNT(DISTINCT r.id) as review_count
    FROM products p
    LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
    WHERE p.slug = $1 AND p.is_active = true
    GROUP BY p.id
  `, [slug]);

  if (!rows.length) return null;
  const product = rows[0];

  const [detailsRows, reviewsRows] = await Promise.all([
    db.query(`
      SELECT 
        (SELECT json_agg(i) FROM (SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order) i) as images,
        (SELECT json_agg(v) FROM (SELECT * FROM variants WHERE product_id=$1) v) as variants
    `, [product.id]),
    db.query(`
      SELECT r.*, u.name as user_name FROM reviews r
      JOIN users u ON u.id=r.user_id
      WHERE r.product_id=$1 AND r.is_approved=true
      ORDER BY r.created_at DESC LIMIT 10
    `, [product.id]),
  ]);

  const images = detailsRows.rows[0]?.images || [];
  const variants = detailsRows.rows[0]?.variants || [];
  const reviews = reviewsRows.rows || [];

  const result = { ...product, images, variants, reviews };
  await cache.set(cacheKey, result, 300);
  return result;
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spraykart.vercel.app';
  const canonical = `${siteUrl}/products/${product.slug || params.slug}`;

  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.description?.substring(0, 160),
    alternates: {
      canonical,
    },
    openGraph: {
      title: product.name,
      description: product.description?.substring(0, 160),
      url: canonical,
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
