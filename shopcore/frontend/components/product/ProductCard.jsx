import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

export default function ProductCard({ product }) {
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }} className="group">
      <div style={{ background: '#ffffff', border: '1px solid #eeeeee', transition: 'border-color .2s' }}>

        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '3/4', background: '#f7f7f5', overflow: 'hidden' }}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: 'cover', transition: 'transform .6s ease' }}
              className="group-hover:scale-105"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f0' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8c8c8' }}>No Image</span>
            </div>
          )}

          {discount > 0 && (
            <span style={{
              position: 'absolute', top: 12, left: 12,
              background: '#0c0c0c', color: '#ffffff',
              fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
              padding: '4px 8px',
            }}>
              -{discount}%
            </span>
          )}

          {product.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,255,255,.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#737373' }}>
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '16px 16px 20px' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#b0b0b0', marginBottom: 6 }}>
            {product.category}
          </p>
          <h3 style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontSize: 17, fontWeight: 400,
            color: '#0c0c0c', lineHeight: 1.3, marginBottom: 8,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {product.name}
          </h3>

          {product.avg_rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={9}
                  fill={i < Math.round(product.avg_rating) ? '#0c0c0c' : 'none'}
                  stroke={i < Math.round(product.avg_rating) ? '#0c0c0c' : '#d0d0d0'}
                />
              ))}
              {product.review_count > 0 && (
                <span style={{ fontSize: 10, color: '#a0a0a0', marginLeft: 2 }}>({product.review_count})</span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0c0c0c', letterSpacing: '-0.01em' }}>
              ₹{parseFloat(product.price).toLocaleString('en-IN')}
            </span>
            {discount > 0 && (
              <span style={{ fontSize: 12, color: '#c0c0c0', textDecoration: 'line-through' }}>
                ₹{parseFloat(product.compare_price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
