'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { memo, useState, useRef, useCallback, useEffect } from 'react';

// Memoized at module level — no recomputation per render
const CLOUDINARY_RE = /\/upload\//;
const FALLBACK_BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAEAwUC/8QAHRAAAQQDAQEAAAAAAAAAAAAAAQACAxESITFBUf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwq1rXua1jQGgcABfLREH/2Q==';

function optimizeCloudinaryUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace(CLOUDINARY_RE, '/upload/f_auto,q_auto,w_400,dpr_auto/');
}

function getBlurDataUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return FALLBACK_BLUR_DATA_URL;
  if (CLOUDINARY_RE.test(url)) {
    return url.replace(CLOUDINARY_RE, '/upload/w_10,q_10,e_blur:1000/');
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=10&q=10&blur=1000`;
}

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
  const discount = product.compare_price
    ? Math.min(Math.round(((product.compare_price - product.price) / product.compare_price) * 100), 70)
    : 0;

  // ── Hover image cycling ────────────────────────────────────────────────────
  const images = [product.image, product.second_image].filter(Boolean);
  const hasMultiple = images.length > 1;
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  const startCycling = useCallback(() => {
    if (!hasMultiple) return;
    setIsHovered(true);
    // Cycle every 800ms
    intervalRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, 800);
  }, [hasMultiple, images.length]);

  const stopCycling = useCallback(() => {
    setIsHovered(false);
    clearInterval(intervalRef.current);
    setActiveIdx(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const currentImage = images[activeIdx] || product.image;

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full outline-none">
      <div className="bg-white border border-gray-100 h-full flex flex-col transition-colors group-hover:border-gray-300">

        {/* Image — rock solid aspect ratio container */}
        <div
          className="relative w-full aspect-[3/4] bg-[#f7f7f5] overflow-hidden shrink-0"
          onMouseEnter={startCycling}
          onMouseLeave={stopCycling}
        >
          {currentImage ? (
            <>
              <Image
                src={optimizeCloudinaryUrl(currentImage)}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-all duration-500 ease-out z-10"
                style={{
                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.5s ease-out, opacity 0.3s ease',
                }}
                priority={priority}
                fetchPriority={priority ? 'high' : 'auto'}
                quality={75}
                placeholder="blur"
                blurDataURL={getBlurDataUrl(product.image)}
              />

              {/* Dot indicators — only if multiple images */}
              {hasMultiple && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === activeIdx ? 16 : 5,
                        height: 5,
                        background: i === activeIdx ? '#000' : 'rgba(0,0,0,0.3)',
                      }}
                    />
                  ))}
                </div>
              )}
            </>
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
