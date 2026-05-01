'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/lib/store';
import { createPayment, verifyPayment, createOrder, applyCoupon, createPaytmPayment } from '@/lib/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { Tag, X, ChevronDown } from 'lucide-react';
import logger from '@/lib/logger';

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
  line1: 'street-address',
  line2: 'address-line2',
  city: 'address-level2',
  state: 'address-level1',
  pincode: 'postal-code',
  phone: 'tel',
};

const selectStyle = {
  width: '100%',
  padding: '12px 36px 12px 14px',
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  fontSize: 14,
  color: '#111',
  background: '#fff',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  outline: 'none',
};

function SelectWrapper({ children }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <ChevronDown size={14} style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af',
      }} />
    </div>
  );
}

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
  const shipping = (total >= 999 || hasFreeShippingCoupon) ? 0 : 49;
  const grandTotal = total + shipping;

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    line1: '', line2: '', city: '', state: '', pincode: '', phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <EmptyState
          icon="bag"
          title="Your cart is empty"
          description="Add some products before checking out"
          actionLabel="Browse products"
          actionHref="/products"
        />
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
      toast.success(`🎉 Saved ₹${data.discount.toLocaleString('en-IN')}!`);
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
    if (!address.line1 || !address.city || !address.state || !address.pincode || !address.phone) {
      return toast.error('Please fill in all required address fields');
    }
    if (address.line1.length > 255) return toast.error('Address line 1 is too long (max 255 chars)');
    if (address.line2 && address.line2.length > 255) return toast.error('Address line 2 is too long (max 255 chars)');
    if (!/^\d{6}$/.test(address.pincode)) return toast.error('Pincode must be 6 digits');
    if (!/^\d{10}$/.test(address.phone)) return toast.error('Phone must be 10 digits');

    // ── Defensive: verify selected payment SDK is configured and loaded ───────
    if (paymentMethod === 'online') {
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
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
      const effectiveShipping = (totalAfterDiscount >= 999 || effectiveCoupon?.free_shipping === true) ? 0 : 49;
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
            name: user.name,          // snapshot customer name with order
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
              name: user.name,
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
          name: user.name,          // snapshot customer name with order
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
        prefill: { name: user.name, email: user.email },
        theme: { color: '#000000' },
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

  const inp = (name, placeholder, type = 'text') => (
    <input
      key={name}
      id={`address-${name}`}
      name={name}
      type={type}
      placeholder={placeholder}
      value={address[name]}
      onChange={(e) => setAddress({ ...address, [name]: e.target.value })}
      className="input"
      autoComplete={ADDRESS_AUTOCOMPLETE[name]}
      inputMode={['pincode', 'phone'].includes(name) ? 'numeric' : undefined}
      maxLength={name === 'pincode' ? 6 : name === 'phone' ? 10 : undefined}
    />
  );

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">

        {/* ── Left: Shipping Address ───────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Shipping Address</h1>
          <div className="space-y-3">
            {inp('line1', 'Address line 1 *')}
            {inp('line2', 'Address line 2 (optional)')}
            {inp('city', 'City *')}

            {/* State dropdown */}
            <SelectWrapper>
              <select
                id="address-state"
                name="state"
                style={selectStyle}
                value={address.state}
                autoComplete={ADDRESS_AUTOCOMPLETE.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
              >
                <option value="">Select State / UT *</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </SelectWrapper>

            {inp('pincode', 'Pincode (6 digits) *', 'tel')}
            {inp('phone', 'Phone number (10 digits) *', 'tel')}
          </div>

          {/* ── Coupon ──────────────────────────────────────────────────────── */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag size={14} /> Coupon Code
            </h3>
            {coupon ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#f0fdf4',
                border: '1px solid #bbf7d0', borderRadius: 8,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {coupon.code}
                  </p>
                  <p style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                    You save ₹{(discount || 0).toLocaleString('en-IN')} 🎉
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  style={{
                    background: 'none', border: '1px solid #86efac',
                    borderRadius: 6, cursor: 'pointer', color: '#16a34a',
                    padding: '4px 10px', display: 'flex', alignItems: 'center',
                    gap: 4, fontSize: 12, fontWeight: 500,
                  }}
                >
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="coupon-input"
                  name="coupon"
                  className="input text-sm"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  autoComplete="off"
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="btn-secondary shrink-0 text-sm"
                  style={{ padding: '10px 20px' }}
                >
                  {couponLoading ? <Spinner size="sm" /> : 'Apply'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          <div className="card p-6 space-y-4">

            {/* Items */}
            {items.map((item) => {
              const itemPrice = item.variant ? parseFloat(item.price) + parseFloat(item.variant.price_modifier || 0) : parseFloat(item.price);
              return (
              <div key={item.cartKey} className="flex items-start justify-between text-sm gap-3">
                <span className="text-gray-700 flex-1 min-w-0">
                  <span className="font-medium">{item.name}</span>
                  {item.variant && <span className="text-gray-400"> · {item.variant.value}</span>}
                  <span className="text-gray-400"> ×{item.quantity}</span>
                </span>
                <span className="font-semibold shrink-0 text-gray-900">
                  ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            )})}

            {/* Totals */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm font-medium" style={{ color: '#16a34a' }}>
                  <span>Coupon {coupon?.code && `(${coupon.code})`}</span>
                  <span>−₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'Free' : '₹49'}
                </span>
              </div>
              {shipping > 0 && (
                <p style={{ fontSize: 11, color: '#a0a0a0', background: '#f7f7f5', padding: '6px 10px' }}>
                  Add ₹{(999 - total).toLocaleString('en-IN')} more for free shipping
                </p>
              )}
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold mb-3">Payment Method</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-4 h-4 text-black focus:ring-black" />
                  <span className="text-sm font-medium">Pay Online (Razorpay)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="paytm" checked={paymentMethod === 'paytm'} onChange={() => setPaymentMethod('paytm')} className="w-4 h-4 text-black focus:ring-black" />
                  <span className="text-sm font-medium">Pay via Paytm</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 text-black focus:ring-black" />
                  <span className="text-sm font-medium">Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>

            <button
              id="checkout-pay-btn"
              onClick={handlePayment}
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2"
            >
              {loading
                ? <><Spinner size="sm" /> Processing...</>
                : paymentMethod === 'cod' ? `Confirm Order (₹${grandTotal.toLocaleString('en-IN')})` : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}
            </button>

            {paymentMethod === 'online' && (
              <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                🔒 Secured by Razorpay
              </p>
            )}
          </div>

          {/* Back to cart */}
          <div className="text-center mt-4">
            <Link href="/cart" style={{ fontSize: 12, color: '#737373', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              ← Back to cart
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
