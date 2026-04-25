'use client';
import { useCartStore, useCartSubtotal, useCartTotalAfterDiscount } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, discount, coupon, removeCoupon } = useCartStore();
  const subtotal = useCartSubtotal();
  const total = useCartTotalAfterDiscount();
  const shipping = subtotal >= 999 ? 0 : 49;
  const grandTotal = total + shipping;

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', background: '#fafaf8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <ShoppingBag size={24} color="#a0a0a0" />
          </div>
          <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 32, fontWeight: 400, color: '#0c0c0c', marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ fontSize: 14, color: '#737373', marginBottom: 32 }}>Browse our fragrances and add something you love</p>
          <Link href="/products" className="btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fafaf8', minHeight: '100vh', padding: '60px 0' }} className="cart-padding">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }} className="cart-inner">
        {/* Header */}
        <div style={{ borderBottom: '1px solid #e8e8e8', paddingBottom: 24, marginBottom: 40 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 8 }}>Your</p>
          <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#0c0c0c', letterSpacing: '-0.01em' }}>
            Shopping Cart <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 400, color: '#a0a0a0', letterSpacing: 0 }}>({items.length} item{items.length > 1 ? 's' : ''})</span>
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }} className="cart-grid">
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e8e8e8', background: '#ffffff' }}>
            {items.map((item, i) => {
              const itemPrice = item.variant ? parseFloat(item.price) + parseFloat(item.variant.price_modifier || 0) : parseFloat(item.price);
              return (
              <div key={item.cartKey} style={{ display: 'flex', gap: 20, padding: '24px', borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'flex-start' }} className="cart-item">
                {/* Image */}
                <Link href={`/products/${item.slug}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                  <div style={{ width: 88, height: 110, background: '#f7f7f5', overflow: 'hidden', position: 'relative' }}>
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="88px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 9, letterSpacing: '0.1em', color: '#c8c8c8', textTransform: 'uppercase' }}>No Image</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a0a0a0', marginBottom: 4 }}>{item.category}</p>
                  <Link href={`/products/${item.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 18, fontWeight: 400, color: '#0c0c0c', marginBottom: 4, lineHeight: 1.3 }}>{item.name}</h3>
                  </Link>
                  {item.variant && (
                    <p style={{ fontSize: 12, color: '#737373', marginBottom: 8 }}>{item.variant.type}: {item.variant.value}</p>
                  )}
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#0c0c0c' }}>₹{itemPrice.toLocaleString('en-IN')}</p>
                </div>

                {/* Qty + remove */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16, flexShrink: 0 }}>
                  <button onClick={() => removeItem(item.cartKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8c8c8', padding: 4, display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e8e8e8' }}>
                    <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                      <Minus size={11} />
                    </button>
                    <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0c0c0c' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                      <Plus size={11} />
                    </button>
                  </div>

                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0c0c0c' }}>
                    ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )})}
          </div>

          {/* Order summary */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
            <div style={{ padding: '24px 24px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: 20, marginBottom: 0 }}>
              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 22, fontWeight: 400, color: '#0c0c0c' }}>Order Summary</h2>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#737373' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#0c0c0c', fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Coupon {coupon?.code && `(${coupon.code})`}
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8c8c8', fontSize: 10, lineHeight: 1 }}>✕</button>
                  </span>
                  <span style={{ color: '#3a7d44' }}>−₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#737373' }}>
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? '#3a7d44' : '#0c0c0c', fontWeight: shipping === 0 ? 500 : 400 }}>
                  {shipping === 0 ? 'Free' : `₹${shipping}`}
                </span>
              </div>

              {subtotal < 999 && (
                <p style={{ fontSize: 11, color: '#a0a0a0', background: '#f7f7f5', padding: '8px 12px', letterSpacing: '0.01em' }}>
                  Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping
                </p>
              )}

              <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 16, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#0c0c0c' }}>
                <span>Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/checkout" className="btn-primary" style={{ width: '100%', padding: '14px', justifyContent: 'center', gap: 8, fontSize: 11, letterSpacing: '0.08em' }}>
                Proceed to Checkout <ArrowRight size={14} />
              </Link>
              <Link href="/products" style={{ textAlign: 'center', fontSize: 12, color: '#737373', textDecoration: 'none', padding: '8px 0', display: 'block' }}>
                ← Continue Shopping
              </Link>
            </div>

            {/* Trust */}
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 24px', display: 'flex', gap: 12, flexDirection: 'column' }}>
              {['🔒 Secure checkout via Razorpay', '📄 GST invoice included', '✅ 100% authentic products'].map(item => (
                <p key={item} style={{ fontSize: 11, color: '#a0a0a0', letterSpacing: '0.02em' }}>{item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
