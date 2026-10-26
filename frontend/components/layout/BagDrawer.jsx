'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Minus, Plus } from 'lucide-react';
import { useCartStore, useCartSubtotal, useBagUI } from '@/lib/store';
import { inr, unitPrice, sizedImage, FREE_SHIPPING_AT, SHIPPING_FEE } from '@/lib/shop';

export default function BagDrawer() {
  const { open, closeBag } = useBagUI();
  const { items, updateQuantity, removeItem, discount } = useCartStore();
  const subtotal = useCartSubtotal();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { closeBag(); }, [pathname, closeBag]);
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeBag();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, closeBag]);

  const lines = mounted ? items : [];
  const toFree = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const shipping = subtotal === 0 || toFree === 0 ? 0 : SHIPPING_FEE;
  const total = Math.max(0, subtotal - (discount || 0)) + shipping;

  return (
    <>
      <div className={`h-scrim${open ? ' is-open' : ''}`} onClick={closeBag} aria-hidden="true" />
      <aside className={`h-drawer h-drawer--right${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Your bag" inert={open ? undefined : ''}>
        <div className="h-drawer__head">
          <span className="t-label-l">Bag ({lines.reduce((n, i) => n + i.quantity, 0)})</span>
          <button className="h-close" onClick={closeBag} aria-label="Close bag"><X size={20} strokeWidth={1.25} /></button>
        </div>

        {lines.length === 0 ? (
          <div className="h-drawer__body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, padding: '0 var(--gutter)' }}>
            <p className="t-display t-m">Your bag is empty.</p>
            <p className="t-small t-mute" style={{ maxWidth: '34ch' }}>Not sure where to start? A 10 ml decant lets you live with a scent for a week before committing to the bottle.</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Link href="/products" className="h-btn">Shop fragrances</Link>
              <Link href="/fragrance-finder" className="h-link" style={{ alignSelf: 'center' }}>Take the finder</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="h-drawer__body">
              <div style={{ padding: '18px var(--gutter)', borderBottom: '1px solid var(--line)' }}>
                <p className="t-small">{toFree > 0 ? <>Add <b className="h-price" style={{ fontWeight: 500 }}>{inr(toFree)}</b> more for free delivery.</> : 'Your order ships free.'}</p>
                <div className="bag-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100)}%` }} /></div>
              </div>
              {lines.map((item) => {
                const price = unitPrice(item, item.variant);
                const img = item.image || item.images?.find((i) => i.is_primary)?.url || item.images?.[0]?.url;
                return (
                  <div className="bag-line" key={item.cartKey}>
                    <Link href={`/products/${item.slug}`} className="bag-line__img">
                      {img && <Image src={sizedImage(img, 240)} alt={item.name} fill sizes="84px" style={{ objectFit: 'cover' }} />}
                    </Link>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                      {item.brand && <span className="t-label t-mute-3">{item.brand}</span>}
                      <Link href={`/products/${item.slug}`} className="t-small" style={{ fontSize: 14 }}>{item.name}</Link>
                      {item.variant && <span className="t-small t-mute">{item.variant.value}</span>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto', paddingTop: 8 }}>
                        <div className="h-qty" style={{ height: 36 }}>
                          <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={12} /></button>
                          <span className="tabular">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} aria-label="Increase quantity"><Plus size={12} /></button>
                        </div>
                        <button className="t-label t-mute" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={() => removeItem(item.cartKey)}>Remove</button>
                      </div>
                    </div>
                    <span className="h-price t-small" style={{ fontSize: 14 }}>{inr(price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-drawer__foot" style={{ display: 'grid', gap: 18 }}>
              <div className="bag-sum">
                <div><span className="t-mute">Subtotal</span><span className="h-price">{inr(subtotal)}</span></div>
                {discount > 0 && <div><span className="t-mute">Coupon</span><span className="h-price">−{inr(discount)}</span></div>}
                <div><span className="t-mute">Delivery</span><span className="h-price">{shipping ? inr(shipping) : 'Free'}</span></div>
                <div className="is-total"><span>Estimated total</span><span className="h-price">{inr(total)}</span></div>
              </div>
              <Link href="/checkout" className="h-btn h-btn--block">Checkout</Link>
              <Link href="/cart" className="h-link" style={{ justifySelf: 'center' }}>View full bag</Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
