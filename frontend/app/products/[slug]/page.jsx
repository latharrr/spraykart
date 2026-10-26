import { notFound } from 'next/navigation';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ReviewSection from '@/components/product/ReviewSection';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { SITE_URL } from '@/lib/env';

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

  const { rows: related } = await db.query(`
    SELECT p.*,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = false ORDER BY sort_order LIMIT 1) AS second_image
    FROM products p
    WHERE p.is_active = true AND p.id <> $1 AND (p.category = $2 OR p.scent_family = $3)
    ORDER BY (p.category = $2) DESC, p.is_featured DESC, p.created_at DESC
    LIMIT 4
  `, [product.id, product.category, product.scent_family || '']);

  const result = { ...product, images, variants, reviews, related };
  await cache.set(cacheKey, result, 300);
  return result;
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return {};
  const canonical = `${SITE_URL}/products/${product.slug || params.slug}`;

  return {
    title: (product.meta_title || product.name).replace(/\s*\|\s*Spraykart\s*$/i, ''),
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

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map((i) => i.url),
    brand: { '@type': 'Brand', name: product.brand || 'Spraykart' },
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug}`,
      price: product.price,
      priceCurrency: 'INR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Spraykart' },
    },
    ...(product.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avg_rating,
        reviewCount: product.review_count,
      },
    }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}/products/${product.slug}` },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { q: `Is this ${product.name} original?`, a: 'Yes. It is sourced as an original, batch-code checked before listing, and ships with a GST invoice.' },
      { q: 'What is a decant?', a: 'The same original perfume, poured from a sealed bottle into a 10 ml atomiser, so you can wear it before buying the full bottle.' },
      { q: 'What if it arrives damaged?', a: 'Report it within 48 hours of delivery with your order ID and photos for a replacement or refund.' },
    ].map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="pd">
        <ProductGallery images={product.images} name={product.name} />
        <div className="pd__info">
          <ProductInfo product={product} />
        </div>
      </div>
      <ReviewSection product={product} reviews={product.reviews} />
      {product.related?.length > 0 && (
        <section className="h-wrap h-section h-rule" aria-labelledby="related-title">
          <div className="hp-head">
            <h2 id="related-title" className="t-display t-l">Also in the house</h2>
            <Link href={`/products?category=${encodeURIComponent(product.category || '')}`} className="h-link">More {String(product.category || 'fragrances').toLowerCase()}</Link>
          </div>
          <div className="h-grid">
            {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
