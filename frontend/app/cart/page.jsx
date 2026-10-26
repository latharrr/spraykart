'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Minus, Plus, ArrowRight } from 'lucide-react';
import { useCartStore, useCartSubtotal, useCartTotalAfterDiscount } from '@/lib/store';
import { inr, unitPrice, sizedImage, nameWithoutHouse, FREE_SHIPPING_AT, SHIPPING_FEE } from '@/lib/shop';

export default function CartPage() {
  const { items, removeItem, updateQuantity, discount, coupon, removeCoupon } = useCartStore();
  const subtotal = useCartSubtotal();
  const total = useCartTotalAfterDiscount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Shipping threshold uses the post-discount total so cart and checkout agree
  const shipping = total >= FREE_SHIPPING_AT || coupon?.free_shipping === true ? 0 : SHIPPING_FEE;
  const grandTotal = total + shipping;
  const units = items.reduce((n, i) => n + (i.quantity || 0), 0);

  if (!mounted) return <div className="h-wrap" style={{ minHeight: '60vh' }} />;

  if (items.length === 0) {
    return (
      <div className="h-wrap h-section" style={{ display: 'grid', gap: 28, justifyItems: 'start', minHeight: '60vh', alignContent: 'center' }}>
        <h1 className="t-display t-xl">Your bag is empty.</h1>
        <p className="t-body t-mute" style={{ maxWidth: '48ch' }}>Start with the house&apos;s newest bottles, or try a 10 ml decant of something you&apos;ve been curious about.</p>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/products" className="h-btn">Shop fragrances</Link>
          <Link href="/fragrance-finder" className="h-link">Take the finder <ArrowRight size={14} strokeWidth={1.25} /></Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="h-wrap pg-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <h1 className="t-display t-xl">Bag</h1>
        <span className="t-label t-mute-3 tabular">{units} {units === 1 ? 'item' : 'items'}</span>
      </header>

      <div className="h-wrap ck" style={{ paddingBlock: '40px 120px' }}>
        <ul style={{ listStyle: 'none' }}>
          {items.map((item) => {
            const price = unitPrice(item, item.variant);
            return (
              <li key={item.cartKey} className="bag-line" style={{ gridTemplateColumns: '120px 1fr auto', paddingInline: 0, gap: 24 }}>
                <Link href={`/products/${item.slug}`} className="bag-line__img">
                  {item.image && <Image src={sizedImage(item.image, 300)} alt={item.name} fill sizes="120px" style={{ objectFit: 'cover' }} />}
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  {item.brand && <span className="t-label t-mute-3">{item.brand}</span>}
                  <Link href={`/products/${item.slug}`} className="t-display t-s">{nameWithoutHouse(item)}</Link>
                  <span className="t-small t-mute">{item.variant ? `${item.variant.value} · ` : ''}{inr(price)} each</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 'auto', paddingTop: 12 }}>
                    <div className="h-qty" style={{ height: 40 }}>
                      <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`}><Minus size={12} /></button>
                      <span className="tabular">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}><Plus size={12} /></button>
                    </div>
                    <button type="button" className="h-link" onClick={() => removeItem(item.cartKey)}>Remove</button>
                  </div>
                </div>
                <span className="h-price" style={{ fontSize: 15 }}>{inr(price * item.quantity)}</span>
              </li>
            );
          })}
        </ul>

        <aside className="ck__aside" aria-label="Order summary">
          <h2 className="t-label-l" style={{ marginBottom: 24 }}>Summary</h2>
          <div className="bag-sum">
            <div><span className="t-mute">Subtotal</span><span className="h-price">{inr(subtotal)}</span></div>
            {discount > 0 && (
              <div>
                <span className="t-mute">Coupon {coupon?.code} <button type="button" className="h-textlink" style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12, marginLeft: 6 }} onClick={removeCoupon}>Remove</button></span>
                <span className="h-price">−{inr(discount)}</span>
              </div>
            )}
            <div><span className="t-mute">Delivery</span><span className="h-price">{shipping ? inr(shipping) : 'Free'}</span></div>
            {shipping > 0 && <p className="t-small t-mute">Add {inr(FREE_SHIPPING_AT - total)} more for free delivery.</p>}
            <div className="is-total"><span>Total</span><span className="h-price">{inr(grandTotal)}</span></div>
          </div>
          <Link href="/checkout" className="h-btn h-btn--block" style={{ marginTop: 28 }}>Checkout</Link>
          <ul className="pd__facts" style={{ marginTop: 28, gap: 8 }}>
            <li style={{ display: 'block' }}>UPI, cards, net banking, or cash on delivery up to ₹2,999.</li>
            <li style={{ display: 'block' }}>Every order ships with a GST invoice.</li>
            <li style={{ display: 'block' }}>Damaged or wrong item? Report it within 48 hours of delivery.</li>
          </ul>
          <Link href="/products" className="h-link" style={{ marginTop: 24 }}>Continue shopping</Link>
        </aside>
      </div>
    </>
  );
}
