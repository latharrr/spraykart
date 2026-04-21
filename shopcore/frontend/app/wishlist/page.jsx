'use client';
import { useState } from 'react';
import { useWishlistStore, useCartStore } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const [addedIds, setAddedIds] = useState({});

  const handleAddToCart = (product) => {
    addItem(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAddedIds((prev) => ({ ...prev, [product.id]: false })), 1500);
  };

  if (items.length === 0) {
    return (
      <div style={{
        minHeight: '70vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '80px 40px', background: '#fafaf8',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, background: '#fdf2f8',
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <Heart size={28} color="#e11d48" />
          </div>
          <h1 style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontSize: 36, fontWeight: 400, color: '#0c0c0c',
            marginBottom: 12, letterSpacing: '-0.01em',
          }}>Your wishlist is empty</h1>
          <p style={{ fontSize: 14, color: '#737373', marginBottom: 32, lineHeight: 1.7 }}>
            Save your favourite fragrances here<br />and come back to them anytime.
          </p>
          <Link href="/products" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', background: '#0c0c0c', color: '#fff',
            textDecoration: 'none', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Explore Fragrances <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fafaf8', minHeight: '100vh', padding: '60px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #e8e8e8', paddingBottom: 24, marginBottom: 40 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Your</p>
          <h1 style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontSize: 40, fontWeight: 400, color: '#0c0c0c', letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'baseline', gap: 12,
          }}>
            Wishlist{' '}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 400, color: '#a0a0a0', letterSpacing: 0 }}>
              ({items.length} item{items.length > 1 ? 's' : ''})
            </span>
          </h1>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {items.map((product) => (
            <div key={product.id} style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              position: 'relative',
              transition: 'box-shadow 0.2s',
            }}>
              {/* Remove from wishlist */}
              <button
                onClick={() => { removeItem(product.id); toast.success('Removed from wishlist'); }}
                aria-label="Remove from wishlist"
                style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 2,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)', border: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#e11d48',
                }}
              >
                <Trash2 size={13} />
              </button>

              {/* Image */}
              <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ width: '100%', aspectRatio: '3/4', background: '#f7f7f5', position: 'relative', overflow: 'hidden' }}>
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="280px" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, letterSpacing: '0.1em', color: '#c8c8c8', textTransform: 'uppercase' }}>No Image</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div style={{ padding: '16px 16px 20px' }}>
                <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 4 }}>
                  {product.category}
                </p>
                <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
                  <h3 style={{
                    fontFamily: "'Cormorant', Georgia, serif",
                    fontSize: 17, fontWeight: 400, color: '#0c0c0c',
                    marginBottom: 8, lineHeight: 1.3,
                  }}>{product.name}</h3>
                </Link>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0c0c0c' }}>
                    ₹{parseFloat(product.price).toLocaleString('en-IN')}
                  </span>
                  {product.compare_price && (
                    <span style={{ fontSize: 12, color: '#a0a0a0', textDecoration: 'line-through' }}>
                      ₹{parseFloat(product.compare_price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={addedIds[product.id] || product.stock === 0}
                  style={{
                    width: '100%', padding: '10px 0',
                    background: addedIds[product.id] ? '#4ade80' : '#0c0c0c',
                    color: '#fff', border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'background 0.2s',
                    opacity: product.stock === 0 ? 0.5 : 1,
                  }}
                >
                  <ShoppingCart size={12} />
                  {product.stock === 0 ? 'Out of Stock' : addedIds[product.id] ? 'Added!' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Continue shopping */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link href="/products" style={{ fontSize: 12, color: '#737373', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
