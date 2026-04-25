'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { memo, useState } from 'react';

// ─── Star row is pure — memoize to avoid 5 Star rerenders per card ─────────────
const StarRow = memo(function StarRow({ avgRating, reviewCount }) {
  if (!avgRating || avgRating <= 0) return null;
  const rounded = Math.round(avgRating);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={9}
          fill={i < rounded ? '#0c0c0c' : 'none'}
          stroke={i < rounded ? '#0c0c0c' : '#d0d0d0'}
        />
      ))}
      {reviewCount > 0 && (
        <span style={{ fontSize: 10, color: '#a0a0a0', marginLeft: 2 }}>({reviewCount})</span>
      )}
    </div>
  );
});

function ProductCard({ product, priority = false }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const discount = product.compare_price
    ? Math.min(Math.round(((product.compare_price - product.price) / product.compare_price) * 100), 70)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full outline-none">
      <div className="bg-white border border-gray-100 h-full flex flex-col transition-colors group-hover:border-gray-300">

        {/* Image — rock solid aspect ratio container */}
        <div className="relative w-full aspect-[3/4] bg-[#f7f7f5] overflow-hidden shrink-0">
          {!isLoaded && product.image && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse z-0" />
          )}
          
          {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover transition-all duration-700 ease-out group-hover:scale-105 z-10 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                quality={80}
              />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f2f2f0]">
              <span className="text-[9px] tracking-[0.15em] uppercase text-[#c8c8c8]">No Image</span>
            </div>
          )}

          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-black text-white text-[9px] font-semibold tracking-[0.1em] px-2 py-1 z-10">
              -{discount}%
            </span>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-500">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-grow">
          <p className="text-[9px] tracking-[0.18em] uppercase text-gray-400 mb-1.5">
            {product.category}
          </p>
          <h3 className="font-serif text-[16px] md:text-[17px] text-black leading-snug mb-2 line-clamp-2">
            {product.name}
          </h3>

          <StarRow avgRating={parseFloat(product.avg_rating)} reviewCount={parseInt(product.review_count)} />

          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="text-[15px] font-semibold text-black tracking-tight">
              ₹{parseFloat(product.price).toLocaleString('en-IN')}
            </span>
            {discount > 0 && (
              <span className="text-[12px] text-gray-400 line-through">
                ₹{parseFloat(product.compare_price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// memo prevents re-render unless product data actually changes
export default memo(ProductCard);
