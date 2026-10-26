'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Minus, Plus, ShieldCheck, Truck, RotateCcw, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useCartStore, useAuthStore, useWishlistStore, useIsWishlisted, useBagUI } from '@/lib/store';
import { applyCoupon } from '@/lib/api';
import { inr, unitPrice, unitMrp, mlOf, perMl, nameWithoutHouse, FREE_SHIPPING_AT, SHIPPING_FEE, WHATSAPP_URL } from '@/lib/shop';

const listOf = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean).join(', ');

// Bottles drawn at true relative scale: same shape, so height grows with the cube root of volume.
// Decants are drawn as a slim atomiser, which is what arrives.
function Bottle({ ml, maxMl }) {
  const k = Math.cbrt((ml || maxMl) / maxMl);
  if (ml && ml <= 15) {
    const h = Math.round(56 * k * 1.35);
    return (
      <svg className="pd__bottle" width="12" height={h} viewBox={`0 0 12 ${h}`} aria-hidden="true">
        <rect x="3.5" y="0.5" width="5" height="6" fill="currentColor" />
        <rect x="1.5" y="6.5" width="9" height={h - 7} fill="none" stroke="currentColor" />
        <rect x="2.5" y={h * 0.45} width="7" height={h * 0.55 - 1.5} fill="currentColor" opacity="0.18" />
      </svg>
    );
  }
  const h = Math.round(56 * k);
  const w = Math.round(h * 0.78);
  const cap = Math.max(5, Math.round(h * 0.2));
  return (
    <svg className="pd__bottle" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <rect x={w * 0.32} y="0.5" width={w * 0.36} height={cap} fill="currentColor" />
      <rect x={w * 0.42} y={cap + 0.5} width={w * 0.16} height="3" fill="currentColor" />
      <rect x="0.5" y={cap + 3.5} width={w - 1} height={h - cap - 4} fill="none" stroke="currentColor" />
      <rect x="1.5" y={cap + 3.5 + (h - cap - 4) * 0.3} width={w - 3} height={(h - cap - 4) * 0.7 - 1} fill="currentColor" opacity="0.18" />
    </svg>
  );
}

export default function ProductInfo({ product }) {
  const router = useRouter();
  const { addItem, setCoupon } = useCartStore();
  const openBag = useBagUI((s) => s.openBag);
  const { user } = useAuthStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const saved = useIsWishlisted(product.id);

  const sizes = useMemo(() => (product.variants || [])
    .filter((v) => v.type === 'size')
    .sort((a, b) => (mlOf(a.value) || 0) - (mlOf(b.value) || 0)), [product.variants]);
  const otherVariants = (product.variants || []).filter((v) => v.type !== 'size');
  const baseSize = sizes.find((v) => Number(v.price_modifier) === 0) || sizes[0] || null;

  const [variant, setVariant] = useState(baseSize || otherVariants[0] || null);
  const [qty, setQty] = useState(1);
  const [coupon, setCouponCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const buyRef = useRef(null);
  const [showBar, setShowBar] = useState(false);

  const price = unitPrice(product, variant);
  const mrp = unitMrp(product, variant);
  const stock = variant ? Number(variant.stock) : Number(product.stock);
  const inStock = stock > 0;
  const ml = mlOf(variant?.value) || mlOf(product.name);
  const maxMl = Math.max(...sizes.map((s) => mlOf(s.value) || 0), 100);
  const lineTotal = price * qty;
  const delivery = lineTotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
  const house = product.brand && !/^spraykart/i.test(product.brand) ? product.brand : null;
  const rest = nameWithoutHouse(product);
  const reviewCount = Number(product.review_count) || 0;

  const notes = [
    ['Top', listOf(product.top_notes)],
    ['Heart', listOf(product.heart_notes)],
    ['Base', listOf(product.base_notes)],
  ].filter(([, v]) => v);
  const profile = [
    ['Family', product.scent_family],
    ['Longevity', product.longevity],
    ['Sillage', product.sillage],
    ['Season', product.season],
    ['Occasion', product.occasion],
  ].filter(([, v]) => v);

  // Show the mobile buy bar only once the main buy row has scrolled above the viewport.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = buyRef.current;
      const past = Boolean(el) && el.getBoundingClientRect().bottom < 0;
      setShowBar(past);
      document.body.classList.toggle('has-mobilebar', past);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      document.body.classList.remove('has-mobilebar');
    };
  }, []);

  const add = () => {
    if (!addItem(product, variant, qty)) {
      toast.error('That size is sold out right now');
      return false;
    }
    openBag();
    return true;
  };

  const buyNow = () => {
    if (addItem(product, variant, qty)) router.push('/checkout');
    else toast.error('That size is sold out right now');
  };

  const onCoupon = async (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    if (!user) { toast.error('Sign in to apply a coupon'); return; }
    setCouponBusy(true);
    try {
      const { data } = await applyCoupon({ code: coupon, cart_total: lineTotal, cart_items: [{ id: product.id, price, quantity: qty }] });
      setCoupon(data.coupon, data.discount);
      toast.success(`Coupon applied. You save ${inr(data.discount)}`);
    } catch (err) {
      toast.error(err?.error || "That code isn't valid for this bottle");
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <div className="pd__sticky">
      <nav className="pd__crumbs" aria-label="Breadcrumb">
        <Link href="/products">Fragrances</Link><span aria-hidden="true">/</span>
        {product.category && <><Link href={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link><span aria-hidden="true">/</span></>}
        <span aria-current="page">{rest}</span>
      </nav>

      <div style={{ display: 'grid', gap: 18 }}>
        <h1 className="t-display pd__name">
          {house && <span style={{ display: 'block' }}>{house}{' '}</span>}
          <span style={{ display: 'block' }}>{rest}</span>
        </h1>
        <div className="pd__priceline">
          <span className="h-price">{inr(price)}</span>
          {mrp && mrp > price && <span className="t-small t-mute h-price">MRP <s>{inr(mrp)}</s></span>}
          {ml && <span className="t-small t-mute-3 h-price" style={{ whiteSpace: 'nowrap' }}>{ml} ml · {perMl(price, ml)}</span>}
        </div>
        <p className="t-small t-mute-3">Inclusive of all taxes.{reviewCount > 0 && <> <a href="#reviews" className="h-textlink">{Number(product.avg_rating).toFixed(1)} / 5 from {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</a></>}</p>
      </div>

      {sizes.length > 0 && (
        <fieldset style={{ display: 'grid', gap: 12 }}>
          <legend className="t-label t-mute" style={{ marginBottom: 12 }}>Size</legend>
          <div className="pd__sizes">
            {sizes.map((v) => {
              const vml = mlOf(v.value);
              const vPrice = unitPrice(product, v);
              return (
                <button key={v.id} type="button" className="pd__size" aria-pressed={variant?.id === v.id} disabled={Number(v.stock) === 0} onClick={() => setVariant(v)}>
                  <Bottle ml={vml} maxMl={maxMl} />
                  <span className="t-small" style={{ color: 'var(--ink)' }}>{v.value}</span>
                  <span className="t-small t-mute h-price">{Number(v.stock) === 0 ? 'Sold out' : inr(vPrice)}</span>
                </button>
              );
            })}
          </div>
          {variant && /decant/i.test(variant.value) && (
            <p className="t-small t-mute">A decant is the same original perfume, poured from a sealed bottle into a 10 ml atomiser.</p>
          )}
        </fieldset>
      )}

      {otherVariants.length > 0 && (
        <fieldset>
          <legend className="t-label t-mute" style={{ marginBottom: 12 }}>Options</legend>
          <div className="pl-chips">
            {otherVariants.map((v) => (
              <button key={v.id} type="button" className="h-chip" aria-pressed={variant?.id === v.id} onClick={() => setVariant(v)} disabled={Number(v.stock) === 0}>{v.value}</button>
            ))}
          </div>
        </fieldset>
      )}

      <div ref={buyRef} style={{ display: 'grid', gap: 12 }}>
        <div className="pd__buy">
          <div className="h-qty" style={{ height: 52 }}>
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity"><Minus size={13} /></button>
            <span className="tabular" aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(stock || 1, q + 1))} disabled={qty >= stock} aria-label="Increase quantity"><Plus size={13} /></button>
          </div>
          <button type="button" className="h-btn" onClick={add} disabled={!inStock}>{inStock ? `Add to bag · ${inr(lineTotal)}` : 'Sold out'}</button>
          <button type="button" className="pd__wish" aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save for later'} onClick={() => toast(toggleWishlist(product) ? 'Saved' : 'Removed from saved')}>
            <Heart size={18} strokeWidth={1.25} />
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <p className="t-small t-mute">
            {inStock && stock <= 5 ? `Only ${stock} left. ` : ''}
            Estimated total <span className="h-price" style={{ color: 'var(--ink)' }}>{inr(lineTotal + delivery)}</span>{delivery ? ` with ${inr(delivery)} delivery` : ', delivery free'}
          </p>
          {inStock && <button type="button" className="h-link" onClick={buyNow}>Buy now</button>}
        </div>
      </div>

      <ul className="pd__facts">
        <li><ShieldCheck size={15} strokeWidth={1.25} /><span>Original, batch-code checked, with a GST invoice in your name.</span></li>
        <li><Truck size={15} strokeWidth={1.25} /><span>Delivered in 3 to 7 business days. Free above {inr(FREE_SHIPPING_AT)}. Cash on delivery up to ₹2,999.</span></li>
        <li><RotateCcw size={15} strokeWidth={1.25} /><span>Arrived damaged or wrong? Report it within 48 hours for a replacement or refund. <Link href="/refund" className="h-textlink">Returns policy</Link></span></li>
        <li><MessageCircle size={15} strokeWidth={1.25} /><span>Buying as a gift or unsure of the size? <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="h-textlink">Ask an advisor on WhatsApp</a></span></li>
      </ul>

      <div>
        {(notes.length > 0 || profile.length > 0) && (
          <details className="h-acc" open>
            <summary>The scent</summary>
            <div className="h-acc__body">
              {notes.length > 0 && (
                <dl className="pd__pyr">
                  {notes.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                </dl>
              )}
              {profile.length > 0 && (
                <dl className="pd__meters">
                  {profile.map(([k, v]) => <div key={k} className="pd__meter"><dt><span>{k}</span></dt><dd><b>{v}</b></dd></div>)}
                </dl>
              )}
            </div>
          </details>
        )}
        {product.description && (
          <details className="h-acc">
            <summary>About this fragrance</summary>
            <div className="h-acc__body prose t-body" dangerouslySetInnerHTML={{ __html: product.description }} />
          </details>
        )}
        <details className="h-acc">
          <summary>Delivery and returns</summary>
          <div className="h-acc__body t-body t-mute" style={{ display: 'grid', gap: 10 }}>
            <p>Orders usually dispatch within 1 to 2 business days and arrive in 2 to 7 depending on your city, with tracking by email. Delivery is free above {inr(FREE_SHIPPING_AT)}; below that it is {inr(SHIPPING_FEE)}.</p>
            <p>If a bottle arrives damaged, defective or isn&apos;t what you ordered, tell us within 48 hours of delivery with your order ID and photos and we will replace or refund it. Opened fragrances can&apos;t be returned for a change of mind.</p>
          </div>
        </details>
        <details className="h-acc">
          <summary>Have a coupon?</summary>
          <form className="h-acc__body" onSubmit={onCoupon}>
            <div className="pd__coupon">
              <label htmlFor="pd-coupon" className="sr-only">Coupon code</label>
              <input id="pd-coupon" value={coupon} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code" autoComplete="off" />
              <button type="submit" disabled={couponBusy}>{couponBusy ? 'Checking' : 'Apply'}</button>
            </div>
          </form>
        </details>
      </div>

      {showBar && (
      <div className="pd-mobilebar is-on">
        <div style={{ display: 'grid' }}>
          <span className="t-small" style={{ fontSize: 13 }}>{rest}</span>
          <span className="t-small t-mute h-price">{inr(price)}{variant ? ` · ${variant.value}` : ''}</span>
        </div>
        <button type="button" className="h-btn" style={{ minHeight: 46, padding: '0 22px' }} onClick={add} disabled={!inStock}>{inStock ? 'Add to bag' : 'Sold out'}</button>
      </div>
      )}
    </div>
  );
}
