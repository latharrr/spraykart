'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCartStore, useAuthStore } from '@/lib/store';
import { createPayment, verifyPayment, createOrder, applyCoupon, createPaytmPayment } from '@/lib/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import logger from '@/lib/logger';
import { inr, unitPrice, sizedImage, nameWithoutHouse, FREE_SHIPPING_AT, SHIPPING_FEE } from '@/lib/shop';
import Image from 'next/image';

// ─── Indian States & UTs ──────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

const ADDRESS_AUTOCOMPLETE = {
  name: 'name',
  line1: 'street-address',
  line2: 'address-line2',
  city: 'address-level2',
  state: 'address-level1',
  pincode: 'postal-code',
  phone: 'tel',
};


export default function CheckoutPage() {
  const router = useRouter();
  const { items, discount, coupon, setCoupon, removeCoupon, clearCart } = useCartStore();
  const { user } = useAuthStore();

  // Compute subtotal directly from items — avoids any selector timing issues
  const subtotal = items.reduce((sum, i) => {
    const price = i.variant
      ? parseFloat(i.price) + parseFloat(i.variant.price_modifier || 0)
      : parseFloat(i.price);
    return sum + price * (i.quantity || 1);
  }, 0);
  const total = Math.max(0, subtotal - (discount || 0));
  const hasFreeShippingCoupon = coupon?.free_shipping === true;
  const shipping = (total >= FREE_SHIPPING_AT || hasFreeShippingCoupon) ? 0 : SHIPPING_FEE;
  const grandTotal = total + shipping;

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="h-wrap h-section" style={{ display: 'grid', gap: 28, justifyItems: 'start', minHeight: '60vh', alignContent: 'center' }}>
        <h1 className="t-display t-xl">Nothing to check out yet.</h1>
        <Link href="/products" className="h-btn">Shop fragrances</Link>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) { toast.error('Sign in to apply coupons'); return; }
    setCouponLoading(true);
    try {
      const { data } = await applyCoupon({
        code: couponCode.trim().toUpperCase(),
        cart_total: subtotal,
        cart_items: items.map((i) => ({ id: i.id, price: i.price, quantity: i.quantity })),
      });
      setCoupon(data.coupon, data.discount);
      setCouponCode('');
      toast.success(`Coupon applied. You save ${inr(data.discount)}`);
    } catch (err) {
      toast.error(err?.error || 'Invalid or expired coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handlePayment = async () => {
    if (!user) return router.push('/login');
    const recipientName = (address.name || user.name || '').trim();
    if (!recipientName || recipientName.length < 2) {
      return toast.error('Add the name of the person receiving the order');
    }
    if (!address.line1 || !address.city || !address.state || !address.pincode || !address.phone) {
      return toast.error('Fill in the address, city, state, pincode and phone');
    }
    if (address.line1.length > 255) return toast.error('Address line 1 is too long (max 255 chars)');
    if (address.line2 && address.line2.length > 255) return toast.error('Address line 2 is too long (max 255 chars)');
    if (!/^\d{6}$/.test(address.pincode)) return toast.error('Pincode should be 6 digits');
    if (!/^\d{10}$/.test(address.phone)) return toast.error('Phone number should be 10 digits');

    // ── Defensive: verify selected payment SDK is configured and loaded ───────
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (paymentMethod === 'online') {
      if (!rzpKey || rzpKey.includes('xxxx')) {
        toast.error('Online payments are temporarily unavailable. Please try again later.');
        return;
      }
      if (typeof window === 'undefined' || typeof window.Razorpay === 'undefined') {
        toast.error('Payment SDK not loaded. Please refresh the page and try again.');
        return;
      }
    }

    setLoading(true);
    const idempotencyKey = uuidv4();

    try {
      const liveSubtotal = items.reduce((sum, i) => {
        const price = i.variant
          ? parseFloat(i.price) + parseFloat(i.variant.price_modifier || 0)
          : parseFloat(i.price);
        return sum + price * (i.quantity || 1);
      }, 0);

      let effectiveCoupon = coupon;
      let effectiveDiscount = discount || 0;

      if (coupon?.code) {
        try {
          const { data } = await applyCoupon({
            code: coupon.code,
            cart_total: liveSubtotal,
            cart_items: items.map((i) => ({ id: i.id, price: i.price, quantity: i.quantity })),
          });
          effectiveCoupon = data.coupon;
          effectiveDiscount = data.discount;
          setCoupon(data.coupon, data.discount);
        } catch (err) {
          removeCoupon();
          toast.error(err?.error || 'Applied coupon is no longer valid. Please try again.');
          setLoading(false);
          return;
        }
      }

      const totalAfterDiscount = Math.max(0, liveSubtotal - effectiveDiscount);
      const effectiveShipping = (totalAfterDiscount >= FREE_SHIPPING_AT || effectiveCoupon?.free_shipping === true) ? 0 : SHIPPING_FEE;
      const effectiveGrandTotal = totalAfterDiscount + effectiveShipping;

      if (paymentMethod === 'cod') {
        if (effectiveGrandTotal > 2999) {
          toast.error('COD is only available for orders up to ₹2,999');
          setLoading(false);
          return;
        }

        await createOrder({
          items: items.map((i) => ({ product_id: i.id, variant_id: i.variant?.id || null, quantity: i.quantity })),
          shipping_address: {
            ...address,
            name: recipientName,      // user-entered recipient name (falls back to account name)
            email: user.email,        // snapshot customer email with order
          },
          coupon_code: effectiveCoupon?.code,
          idempotency_key: idempotencyKey,
          payment_method: 'cod'
        });
        clearCart();
        router.push('/order-confirmed');
        return;
      }

      // If Paytm selected, use Paytm flow
      if (paymentMethod === 'paytm') {
        try {
          const { data: paytm } = await createPaytmPayment({ amount: effectiveGrandTotal });
          if (!paytm?.txnToken) throw new Error('Failed to get Paytm token');

          // Create order record (no razorpay_order_id)
          await createOrder({
            items: items.map((i) => ({ product_id: i.id, variant_id: i.variant?.id || null, quantity: i.quantity })),
            shipping_address: {
              ...address,
              name: recipientName,
              email: user.email,
            },
            coupon_code: effectiveCoupon?.code,
            razorpay_order_id: null,
            paytm_order_id: paytm.orderId,
            idempotency_key: idempotencyKey,
            payment_method: 'online'
          });

          // Load Paytm checkout script for merchant
          const mid = paytm.mid;
          const scriptSrc = `${process.env.NEXT_PUBLIC_PAYTM_HOST || 'https://securegw-stage.paytm.in'}/merchantpgpui/checkoutjs/merchants/${mid}.js`;
          await new Promise((res, rej) => {
            if (document.querySelector(`script[src="${scriptSrc}"]`)) return res();
            const s = document.createElement('script');
            s.src = scriptSrc;
            s.async = true;
            s.onload = res;
            s.onerror = rej;
            document.body.appendChild(s);
          });

          const config = {
            root: '',
            flow: 'DEFAULT',
            data: { orderId: paytm.orderId, token: paytm.txnToken, tokenType: 'TXN_TOKEN', amount: effectiveGrandTotal.toString() },
            handler: { notifyMerchant: (eventName, data) => logger.info('Paytm event', { eventName, data }) },
          };

          // eslint-disable-next-line no-undef
          window.Paytm?.CheckoutJS?.init(config).then(() => window.Paytm.CheckoutJS.invoke());
          setLoading(false);
          return;
        } catch (err) {
          toast.error(err?.error || 'Failed to initiate Paytm payment');
          setLoading(false);
          return;
        }
      }

      const { data } = await createPayment({ amount: effectiveGrandTotal });

      await createOrder({
        items: items.map((i) => ({
          product_id: i.id,
          variant_id: i.variant?.id || null,
          quantity: i.quantity,
        })),
        shipping_address: {
          ...address,
          name: recipientName,      // user-entered recipient name (falls back to account name)
          email: user.email,        // snapshot customer email with order
        },
        coupon_code: effectiveCoupon?.code,
        razorpay_order_id: data.order_id,
        idempotency_key: idempotencyKey,
        payment_method: 'online'
      });

      const options = {
        key: rzpKey,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'Spraykart',
        description: `${items.length} item${items.length > 1 ? 's' : ''}`,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          } catch { /* webhook handles idempotent fallback */ }
          clearCart();
          router.push('/order-confirmed');
        },
        prefill: { name: recipientName, email: user.email, contact: address.phone },
        theme: { color: '#0D0D0D' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res) => {
        toast.error(`Payment failed: ${res.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.error || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const field = (name, label, { type = 'text', optional = false, span = 2 } = {}) => (
    <label className="h-field" style={{ gridColumn: `span ${span}` }} key={name}>
      <span>{label}{optional ? ' (optional)' : ''}</span>
      <input
        id={`address-${name}`}
        name={name}
        type={type}
        value={address[name]}
        onChange={(e) => setAddress({ ...address, [name]: e.target.value })}
        className="input"
        autoComplete={ADDRESS_AUTOCOMPLETE[name]}
        inputMode={['pincode', 'phone'].includes(name) ? 'numeric' : undefined}
        maxLength={name === 'pincode' ? 6 : name === 'phone' ? 10 : name === 'name' ? 100 : undefined}
        placeholder={name === 'name' && user?.name ? user.name : undefined}
        required={!optional}
      />
    </label>
  );

  const methods = [
    { id: 'online', title: 'UPI, cards and net banking', note: 'Paid securely through Razorpay.' },
    { id: 'paytm', title: 'Paytm', note: 'Wallet, UPI or cards through Paytm.' },
    { id: 'cod', title: 'Cash on delivery', note: grandTotal > 2999 ? 'Available on orders up to ₹2,999.' : 'Pay in cash when it arrives.', disabled: grandTotal > 2999 },
  ];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <header className="h-wrap pg-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <h1 className="t-display t-xl">Checkout</h1>
        <Link href="/cart" className="h-link"><ArrowLeft size={14} strokeWidth={1.25} /> Back to bag</Link>
      </header>

      <div className="h-wrap ck" style={{ paddingBlock: '8px 120px' }}>
        <div>
          {!user && (
            <section className="ck__step" style={{ borderTop: 0 }}>
              <p className="t-body">You&apos;ll need an account to place the order and track it. <Link href="/login?redirect=/checkout" className="h-textlink">Sign in</Link> or <Link href="/register" className="h-textlink">create an account</Link>; your bag stays as it is.</p>
            </section>
          )}

          <section className="ck__step" style={!user ? undefined : { borderTop: 0 }}>
            <h2><span className="t-display t-m">Delivery address</span></h2>
            <div className="ck__grid">
              {field('name', 'Recipient name')}
              {field('line1', 'Address')}
              {field('line2', 'Apartment, landmark', { optional: true })}
              {field('city', 'City', { span: 1 })}
              <label className="h-field" style={{ gridColumn: 'span 1' }}>
                <span>State</span>
                <select id="address-state" name="state" className="input" value={address.state} autoComplete={ADDRESS_AUTOCOMPLETE.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required>
                  <option value="">Select</option>
                  {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </label>
              {field('pincode', 'Pincode', { type: 'tel', span: 1 })}
              {field('phone', 'Phone (for the courier)', { type: 'tel', span: 1 })}
            </div>
          </section>

          <section className="ck__step">
            <h2><span className="t-display t-m">Payment</span></h2>
            <div style={{ display: 'grid', gap: 8 }} role="radiogroup" aria-label="Payment method">
              {methods.map((m) => (
                <label key={m.id} className={`ck__opt${paymentMethod === m.id ? ' is-on' : ''}`} style={m.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                  <span className="h-check" style={{ minHeight: 0 }}>
                    <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} disabled={m.disabled} onChange={() => setPaymentMethod(m.id)} />
                  </span>
                  <span style={{ display: 'grid', gap: 2 }}>
                    <span style={{ fontSize: 14 }}>{m.title}</span>
                    <span className="t-small t-mute">{m.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="ck__step">
            <h2><span className="t-display t-m">Coupon</span></h2>
            {coupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '16px 18px', border: '1px solid var(--merlot)', background: 'var(--paper)' }}>
                <span className="t-small"><b style={{ fontWeight: 500, letterSpacing: '.08em' }}>{coupon.code}</b> applied. You save <span className="h-price">{inr(discount || 0)}</span>.</span>
                <button type="button" className="h-link" onClick={handleRemoveCoupon}>Remove</button>
              </div>
            ) : (
              <div className="pd__coupon" style={{ maxWidth: 420 }}>
                <label htmlFor="coupon-input" className="sr-only">Coupon code</label>
                <input id="coupon-input" name="coupon" placeholder="Enter code" value={couponCode} autoComplete="off" onChange={(e) => setCouponCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>{couponLoading ? 'Checking' : 'Apply'}</button>
              </div>
            )}
          </section>
        </div>

        <aside className="ck__aside" aria-label="Order summary">
          <h2 className="t-label-l" style={{ marginBottom: 20 }}>Your order</h2>
          <ul style={{ listStyle: 'none', display: 'grid', gap: 16, marginBottom: 24 }}>
            {items.map((item) => (
              <li key={item.cartKey} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 14, alignItems: 'center' }}>
                <span className="bag-line__img" style={{ width: 56 }}>
                  {item.image && <Image src={sizedImage(item.image, 160)} alt="" fill sizes="56px" style={{ objectFit: 'cover' }} />}
                </span>
                <span style={{ display: 'grid', minWidth: 0 }}>
                  <span className="t-small" style={{ fontSize: 14 }}>{nameWithoutHouse(item)}</span>
                  <span className="t-small t-mute">{[item.brand, item.variant?.value, `× ${item.quantity}`].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="h-price t-small" style={{ fontSize: 14 }}>{inr(unitPrice(item, item.variant) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="bag-sum">
            <div><span className="t-mute">Subtotal</span><span className="h-price">{inr(subtotal)}</span></div>
            {discount > 0 && <div><span className="t-mute">Coupon {coupon?.code}</span><span className="h-price">−{inr(discount)}</span></div>}
            <div><span className="t-mute">Delivery</span><span className="h-price">{shipping ? inr(shipping) : 'Free'}</span></div>
            {shipping > 0 && <p className="t-small t-mute">Add {inr(FREE_SHIPPING_AT - total)} more for free delivery.</p>}
            <div className="is-total"><span>Total</span><span className="h-price">{inr(grandTotal)}</span></div>
          </div>
          <button id="checkout-pay-btn" type="button" onClick={handlePayment} disabled={loading} className="h-btn h-btn--block" style={{ marginTop: 28 }}>
            {loading ? <><Spinner size="sm" /> Processing</> : paymentMethod === 'cod' ? `Place order · ${inr(grandTotal)}` : `Pay ${inr(grandTotal)}`}
          </button>
          <p className="t-small t-mute" style={{ marginTop: 14 }}>A GST invoice is emailed with your order confirmation.</p>
        </aside>
      </div>
    </>
  );
}
