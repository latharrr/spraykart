import { notFound } from 'next/navigation';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ReviewSection from '@/components/product/ReviewSection';

export async function generateMetadata({ params }) {
  try {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/products/${params.slug}`);
    if (!res.ok) return {};
    const p = await res.json();
    return {
      title: p.meta_title || p.name,
      description: p.meta_description || p.description?.substring(0, 160),
      openGraph: {
        title: p.name,
        description: p.description?.substring(0, 160),
        images: p.images?.[0]?.url ? [{ url: p.images[0].url }] : [],
      },
    };
  } catch { return {}; }
}

export default async function ProductPage({ params }) {
  let product;
  try {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000';
    const res = await fetch(
      `${backendUrl}/api/products/${params.slug}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) notFound();
    product = await res.json();
  } catch { notFound(); }

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
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductGallery images={product.images} />
        <ProductInfo product={product} />
      </div>
      <ReviewSection product={product} reviews={product.reviews} />
    </div>
  );
}
