'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/lib/store';
import { createPayment, verifyPayment, createOrder } from '@/lib/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, subtotal, discount, coupon, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ line1: '', city: '', state: '', pincode: '', phone: '' });

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

  const handlePayment = async () => {
    if (!user) return router.push('/login');
    if (!address.line1 || !address.city || !address.pincode || !address.phone) {
      return toast.error('Please fill in all address fields');
    }

    setLoading(true);
    const idempotencyKey = uuidv4(); // Unique key for this checkout attempt

    try {
      // Step 1: Create Razorpay order
      const { data } = await createPayment({ amount: total });

      // Step 2: Save order as 'pending' BEFORE opening Razorpay
      // This ensures the order exists even if browser closes mid-payment
      await createOrder({
        items: items.map((i) => ({
          product_id: i.id,
          variant_id: i.variant?.id || null,
          quantity: i.quantity,
        })),
        shipping_address: address,
        coupon_code: coupon?.code,
        razorpay_order_id: data.order_id,
        idempotency_key: idempotencyKey, // Prevents duplicate on retry
      });

      // Step 3: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'ShopCore',
        description: `${items.length} item${items.length > 1 ? 's' : ''}`,
        handler: async (response) => {
          try {
            // Step 4: Verify payment (fast path — webhook is the reliable fallback)
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            router.push('/order-confirmed');
          } catch {
            // Even if verify fails, the Razorpay webhook will confirm the order
            clearCart();
            router.push('/order-confirmed');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#000000' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res) => {
        toast.error(`Payment failed: ${res.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.error || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const fields = [
    { name: 'line1', placeholder: 'Address line 1 *' },
    { name: 'city', placeholder: 'City *' },
    { name: 'state', placeholder: 'State *' },
    { name: 'pincode', placeholder: 'Pincode (6 digits) *' },
    { name: 'phone', placeholder: 'Phone number (10 digits) *' },
  ];

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Shipping Address */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Shipping Address</h1>
          <div className="space-y-3">
            {fields.map(({ name, placeholder }) => (
              <input
                key={name}
                id={`address-${name}`}
                placeholder={placeholder}
                value={address[name]}
                onChange={(e) => setAddress({ ...address, [name]: e.target.value })}
                className="input"
              />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          <div className="card p-6 space-y-4">
            {items.map((item) => (
              <div key={item.cartKey} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex-1 truncate pr-4">
                  {item.name}
                  {item.variant && <span className="text-gray-400"> · {item.variant.value}</span>}
                  {' '}<span className="text-gray-400">×{item.quantity}</span>
                </span>
                <span className="font-medium shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Discount {coupon?.code && `(${coupon.code})`}</span>
                  <span>−₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">{total >= 999 ? 'Free' : '₹49'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{(total + (total < 999 ? 49 : 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              id="checkout-pay-btn"
              onClick={handlePayment}
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2"
            >
              {loading ? <><Spinner size="sm" /> Processing...</> : `Pay ₹${(total + (total < 999 ? 49 : 0)).toLocaleString('en-IN')}`}
            </button>

            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              🔒 Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
