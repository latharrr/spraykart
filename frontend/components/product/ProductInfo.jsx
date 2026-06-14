'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Zap, Star, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore, useWishlistStore, useIsWishlisted } from '@/lib/store';
import { applyCoupon } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

export default function ProductInfo({ product }) {
  const { addItem, setCoupon } = useCartStore();
  const { user } = useAuthStore();
  const { toggle: toggleWishlist } = useWishlistStore();
  const wishlisted = useIsWishlisted(product.id);
  const router = useRouter();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Price display — if variant has its own price use it, otherwise fall back to base
  const displayPrice = selectedVariant
    ? parseFloat(product.price) + parseFloat(selectedVariant.price_modifier || 0)
    : parseFloat(product.price);

  // Compare price — prefer variant-level compare_price, then product-level, adjusted by modifier
  const displayComparePrice = selectedVariant?.compare_price
    ? parseFloat(selectedVariant.compare_price)
    : product.compare_price
    ? parseFloat(product.compare_price) + (selectedVariant ? parseFloat(selectedVariant.price_modifier || 0) : 0)
    : null;

  const discount = displayComparePrice
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : 0;

  // Group variants by type
  const variantGroups = (product.variants || []).reduce((acc, v) => {
    acc[v.type] = acc[v.type] || [];
    acc[v.type].push(v);
    return acc;
  }, {});

  const handleAddToCart = () => {
    const addedToCart = addItem(product, selectedVariant, quantity);
    if (!addedToCart) {
      toast.error('This item is currently out of stock');
      return;
    }
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) { toast.error('Sign in to apply coupons'); return; }

    const cartSubtotal = displayPrice * quantity;
    setCouponLoading(true);
    try {
      const { data } = await applyCoupon({
        code: couponCode,
        cart_total: cartSubtotal,
        cart_items: [{ id: product.id, price: displayPrice, quantity }],
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

  const hasFragranceNotes = product.top_notes || product.heart_notes || product.base_notes;
  const hasScentProfile = product.scent_family || product.longevity || product.sillage || product.season || product.occasion;

  const tabs = [
    { id: 'description', label: 'Description' },
    ...(hasFragranceNotes || hasScentProfile ? [{ id: 'fragrance', label: 'Fragrance Notes' }] : []),
    { id: 'reviews', label: `Reviews (${product.review_count || 0})` },
  ];

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
          ₹{displayPrice.toLocaleString('en-IN')}
        </span>
        {displayComparePrice && displayComparePrice > displayPrice && (
          <>
            <span className="text-xl text-gray-400 line-through">
              ₹{displayComparePrice.toLocaleString('en-IN')}
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
            {variants.map((v) => {
              const vPrice = parseFloat(product.price) + parseFloat(v.price_modifier || 0);
              const vCompare = v.compare_price ? parseFloat(v.compare_price) : null;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium border transition flex flex-col items-center ${
                    selectedVariant?.id === v.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400'
                  } ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={v.stock === 0}
                >
                  <span>{v.value}</span>
                  <span className={`text-xs mt-0.5 ${selectedVariant?.id === v.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    ₹{vPrice.toLocaleString('en-IN')}
                    {vCompare && vCompare > vPrice && (
                      <span className="line-through ml-1 opacity-60">₹{vCompare.toLocaleString('en-IN')}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-gray-700">Qty:</p>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >−</button>
          <span className="w-11 text-center text-sm font-medium">{quantity}</span>
          <button
            className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >+</button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || added}
          className="btn-primary flex-1 min-h-[48px] py-3.5 gap-2"
        >
          <ShoppingCart size={18} />
          {added ? 'Added!' : 'Add to cart'}
        </button>
        <button
          onClick={() => { handleAddToCart(); router.push('/checkout'); }}
          disabled={!inStock}
          className="btn-secondary flex-1 min-h-[48px] py-3.5 gap-2"
        >
          <Zap size={18} />
          Buy now
        </button>
        {/* Wishlist toggle */}
        <button
          onClick={() => {
            const added = toggleWishlist(product);
            toast.success(added ? '❤️ Added to wishlist' : 'Removed from wishlist');
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: wishlisted ? '1px solid #fda4af' : '1px solid #e5e7eb',
            background: wishlisted ? '#fff1f2' : '#ffffff',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Heart size={18} fill={wishlisted ? '#e11d48' : 'none'} color={wishlisted ? '#e11d48' : '#9ca3af'} />
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
        <button onClick={handleApplyCoupon} disabled={couponLoading} className="btn-secondary shrink-0 text-sm min-h-[44px] py-2 px-4">
          {couponLoading ? <Spinner size="sm" /> : 'Apply'}
        </button>
      </div>

      {/* Tabs: Description | Fragrance Notes | Reviews */}
      <div className="border-t border-gray-100 pt-5">
        {/* Tab Nav */}
        <div className="flex gap-0 border-b border-gray-100 mb-5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-medium px-4 py-2.5 border-b-2 shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description Tab */}
        {activeTab === 'description' && (
          <div>
            {product.description ? (
              <div
                className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-sm text-gray-400 italic">No description available.</p>
            )}
          </div>
        )}

        {/* Fragrance Notes Tab */}
        {activeTab === 'fragrance' && (
          <div className="space-y-6">
            {/* Top / Heart / Base notes cards */}
            {hasFragranceNotes && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Top Notes', notes: product.top_notes, color: '#f59e0b', bg: '#fffbeb', emoji: '🌿' },
                  { label: 'Heart Notes', notes: product.heart_notes, color: '#e11d48', bg: '#fff1f2', emoji: '🌸' },
                  { label: 'Base Notes', notes: product.base_notes, color: '#7c3aed', bg: '#f5f3ff', emoji: '🪵' },
                ].map(({ label, notes, color, bg, emoji }) => notes ? (
                  <div key={label} className="flex flex-col items-center text-center p-4 rounded-xl border" style={{ background: bg, borderColor: `${color}20` }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 text-2xl" style={{ background: `${color}15` }}>
                      {emoji}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {notes.split(',').map((n) => (
                        <span key={n} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}18`, color }}>
                          {n.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null)}
              </div>
            )}

            {/* Scent Profile */}
            {hasScentProfile && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Scent Profile</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { label: 'Family', value: product.scent_family },
                    { label: 'Longevity', value: product.longevity },
                    { label: 'Sillage', value: product.sillage },
                    { label: 'Season', value: product.season },
                    { label: 'Occasion', value: product.occasion },
                  ].filter(i => i.value).map(({ label, value }) => (
                    <div key={label}>
                      <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">{label}</span>
                      <span className="text-sm font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews tab placeholder — ReviewSection handles full display below the fold */}
        {activeTab === 'reviews' && (
          <div className="text-sm text-gray-500">
            <p>Scroll down to see all reviews.</p>
          </div>
        )}
      </div>
    </div>
  );
}
