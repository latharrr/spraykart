'use client';
import { useState } from 'react';
import { ShoppingCart, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '@/lib/store';
import { applyCoupon } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

export default function ProductInfo({ product }) {
  const { addItem, setCoupon } = useCartStore();
  const { user } = useAuthStore();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  // Group variants by type
  const variantGroups = (product.variants || []).reduce((acc, v) => {
    acc[v.type] = acc[v.type] || [];
    acc[v.type].push(v);
    return acc;
  }, {});

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) { toast.error('Sign in to apply coupons'); return; }

    const cartSubtotal = product.price * quantity;
    setCouponLoading(true);
    try {
      const { data } = await applyCoupon({
        code: couponCode,
        cart_total: cartSubtotal,
        cart_items: [{ id: product.id, price: product.price, quantity }],
      });
      setCoupon(data.coupon, data.discount);
      if (data.is_product_specific) {
        toast.success(`Coupon applied to this product! Saved ₹${data.discount.toFixed(2)}`);
      } else {
        toast.success(`Coupon applied! Saved ₹${data.discount.toFixed(2)}`);
      }
    } catch (err) {
      toast.error(err?.error || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const inStock = product.stock > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Category */}
      <p className="text-sm text-gray-400 uppercase tracking-widest">{product.category}</p>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

      {/* Rating */}
      {product.review_count > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < Math.round(product.avg_rating) ? '#fbbf24' : 'none'}
                stroke={i < Math.round(product.avg_rating) ? '#fbbf24' : '#d1d5db'}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {parseFloat(product.avg_rating).toFixed(1)} · {product.review_count} review{product.review_count !== 1 && 's'}
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold text-gray-900">
          ₹{parseFloat(product.price).toLocaleString('en-IN')}
        </span>
        {product.compare_price && (
          <>
            <span className="text-xl text-gray-400 line-through">
              ₹{parseFloat(product.compare_price).toLocaleString('en-IN')}
            </span>
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {discount}% off
            </span>
          </>
        )}
      </div>

      {/* Stock */}
      <div className={`text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
        {inStock ? `${product.stock > 10 ? 'In stock' : `Only ${product.stock} left!`}` : 'Out of stock'}
      </div>

      {/* Variants */}
      {Object.entries(variantGroups).map(([type, variants]) => (
        <div key={type}>
          <p className="text-sm font-medium text-gray-700 mb-2 capitalize">{type}:</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  selectedVariant?.id === v.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                } ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={v.stock === 0}
              >
                {v.value}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-gray-700">Qty:</p>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >−</button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >+</button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || added}
          className="btn-primary flex-1 py-3.5 gap-2"
        >
          <ShoppingCart size={18} />
          {added ? 'Added!' : 'Add to cart'}
        </button>
        <button
          onClick={() => { handleAddToCart(); window.location.href = '/checkout'; }}
          disabled={!inStock}
          className="btn-secondary flex-1 py-3.5 gap-2"
        >
          <Zap size={18} />
          Buy now
        </button>
      </div>

      {/* Coupon */}
      <div className="flex gap-2">
        <input
          className="input text-sm"
          placeholder="Apply coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
        />
        <button onClick={handleApplyCoupon} disabled={couponLoading} className="btn-secondary shrink-0 text-sm py-2 px-4">
          {couponLoading ? <Spinner size="sm" /> : 'Apply'}
        </button>
      </div>

      {/* Description */}
      {product.description && (
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>
      )}
    </div>
  );
}
