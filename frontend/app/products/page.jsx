'use client';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SlidersHorizontal, ChevronDown, X, Search, TrendingUp } from 'lucide-react';
import { useEffect, useRef, Suspense } from 'react';

const CATEGORIES = ['Men', 'Women', 'Unisex', 'Attar', 'Gift Sets'];
const SORTS = [
  { label: 'Newest', value: 'created_at:DESC' },
  { label: 'Price: Low to High', value: 'price:ASC' },
  { label: 'Price: High to Low', value: 'price:DESC' },
  { label: 'Name A–Z', value: 'name:ASC' },
];

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: 'Above ₹5,000', min: 5000, max: 999999 },
];

const OCCASIONS = ['Daily Wear', 'Office', 'Date Night', 'Party', 'Gifting', 'Gym', 'Travel'];
const FRAGRANCE_NOTES = ['Oud', 'Rose', 'Musk', 'Citrus', 'Woody', 'Fresh', 'Floral', 'Spicy', 'Vanilla', 'Amber'];
const BRANDS = ['Dior', 'Chanel', 'YSL', 'Versace', 'Armani', 'Davidoff', 'Rasasi', 'Al Haramain', 'Swiss Arabian'];

const TRENDING_SEARCHES = [
  'Dior Sauvage', 'YSL Y', 'Bleu De Chanel', 'Club De Nuit', 'Versace Dylan Blue',
  'Oud', 'Gift Sets', 'Attar', 'Creed Aventus',
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchTimeout = useRef(null);
  const searchRef = useRef(null);

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'created_at:DESC';
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  const occasion = searchParams.get('occasion') || '';
  const note = searchParams.get('note') || '';
  const brand = searchParams.get('brand') || '';
  const availability = searchParams.get('availability') || '';
  const [sortField, sortOrder] = sortParam.split(':');

  const activeFilterCount = [category, priceMin, occasion, note, brand, availability].filter(Boolean).length;

  const updateParam = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value); else params.delete(key);
    });
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  const clearAllFilters = () => {
    router.push('/products');
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getProducts({
        category, search, sort: sortField, order: sortOrder,
        page, limit: 12,
        price_min: priceMin || undefined,
        price_max: priceMax || undefined,
        occasion: occasion || undefined,
        note: note || undefined,
        brand: brand || undefined,
        in_stock: availability === 'in_stock' ? true : undefined,
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      const msg = (typeof err === 'string' ? err : null) ||
        (typeof err?.error === 'string' ? err.error : null) ||
        (typeof err?.message === 'string' ? err.message : null) ||
        'Failed to load products.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [category, search, sortField, sortOrder, page, priceMin, priceMax, occasion, note, brand, availability]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {category || 'All Products'}
          </h1>
          {!loading && total > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{total} products</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              className="input text-sm pr-8 appearance-none cursor-pointer py-2"
              value={sortParam}
              onChange={(e) => updateParam({ sort: e.target.value })}
            >
              {SORTS.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className="btn-secondary text-sm py-2 gap-2 relative"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: '#0c0c0c', color: '#fff',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Search with Trending Suggestions ─────────────────────────── */}
      <div className="mb-6 relative" ref={searchRef}>
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input text-sm pl-9"
            placeholder="Search fragrances..."
            defaultValue={search}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              clearTimeout(searchTimeout.current);
              searchTimeout.current = setTimeout(() => updateParam({ search: e.target.value }), 400);
            }}
            style={{ maxWidth: 400 }}
          />
        </div>

        {/* Trending searches dropdown */}
        {searchFocused && !search && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 30,
            width: 400, maxWidth: '90vw',
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,.10)',
            padding: '16px 0',
            marginTop: 4,
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#9ca3af',
              padding: '0 16px 12px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <TrendingUp size={11} /> Trending Searches
            </p>
            {TRENDING_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => {
                  updateParam({ search: term });
                  setSearchFocused(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 16px',
                  fontSize: 13, color: '#3d3d3d',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9f9f7'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Search size={12} color="#c8c8c8" />
                {term}
              </button>
            ))}

            {/* Category pills */}
            <div style={{ padding: '12px 16px 0', borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>
                Browse by Category
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { updateParam({ category: cat }); setSearchFocused(false); }}
                    style={{
                      padding: '5px 12px',
                      fontSize: 12, fontWeight: 500,
                      border: '1px solid #e8e8e8',
                      borderRadius: 100,
                      background: category === cat ? '#0c0c0c' : '#fff',
                      color: category === cat ? '#fff' : '#3d3d3d',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Advanced Filters Panel ──────────────────────────────────────── */}
      {showFilters && (
        <div style={{
          background: '#fff', border: '1px solid #e8e8e8',
          borderRadius: 4, marginBottom: 24, padding: 24,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>

            {/* Category / Gender */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: 10 }}>Gender</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="gender" checked={!category} onChange={() => updateParam({ category: '' })} />
                  All
                </label>
                {CATEGORIES.map(cat => (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" name="gender" checked={category === cat} onChange={() => updateParam({ category: cat })} />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: 10 }}>Price Range</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="price" checked={!priceMin && !priceMax} onChange={() => updateParam({ price_min: '', price_max: '' })} />
                  All Prices
                </label>
                {PRICE_RANGES.map(({ label, min, max }) => (
                  <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="radio" name="price"
                      checked={priceMin === String(min) && priceMax === String(max)}
                      onChange={() => updateParam({ price_min: String(min), price_max: String(max) })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: 10 }}>Availability</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="avail" checked={!availability} onChange={() => updateParam({ availability: '' })} />
                  All
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="avail" checked={availability === 'in_stock'} onChange={() => updateParam({ availability: 'in_stock' })} />
                  In Stock Only
                </label>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: 10, marginTop: 20 }}>Special</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="special" checked={sortParam === 'created_at:DESC'} onChange={() => updateParam({ sort: 'created_at:DESC' })} />
                  New Arrivals
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="special" checked={sortParam === 'sold:DESC'} onChange={() => updateParam({ sort: 'sold:DESC' })} />
                  Best Sellers
                </label>
              </div>
            </div>

            {/* Fragrance Notes */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: 10 }}>Fragrance Notes</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FRAGRANCE_NOTES.map(n => (
                  <button
                    key={n}
                    onClick={() => updateParam({ note: note === n ? '' : n })}
                    style={{
                      padding: '4px 10px', fontSize: 12,
                      border: `1px solid ${note === n ? '#0c0c0c' : '#e8e8e8'}`,
                      borderRadius: 100,
                      background: note === n ? '#0c0c0c' : '#fff',
                      color: note === n ? '#fff' : '#3d3d3d',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Occasion */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: 10 }}>Occasion</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {OCCASIONS.map(o => (
                  <button
                    key={o}
                    onClick={() => updateParam({ occasion: occasion === o ? '' : o })}
                    style={{
                      padding: '4px 10px', fontSize: 12,
                      border: `1px solid ${occasion === o ? '#0c0c0c' : '#e8e8e8'}`,
                      borderRadius: 100,
                      background: occasion === o ? '#0c0c0c' : '#fff',
                      color: occasion === o ? '#fff' : '#3d3d3d',
                      cursor: 'pointer',
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: 10 }}>Brand</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {BRANDS.map(b => (
                  <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={brand === b} onChange={() => updateParam({ brand: brand === b ? '' : b })} />
                    {b}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Apply / Clear */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <button onClick={clearAllFilters} className="btn-secondary text-sm py-2">Clear All</button>
            <button onClick={() => setShowFilters(false)} className="btn-primary text-sm py-2">Apply Filters</button>
          </div>
        </div>
      )}

      {/* ── Active filter chips ──────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {category && <FilterChip label={`Gender: ${category}`} onRemove={() => updateParam({ category: '' })} />}
          {priceMin && <FilterChip label={PRICE_RANGES.find(p => String(p.min) === priceMin)?.label || 'Price'} onRemove={() => updateParam({ price_min: '', price_max: '' })} />}
          {occasion && <FilterChip label={`Occasion: ${occasion}`} onRemove={() => updateParam({ occasion: '' })} />}
          {note && <FilterChip label={`Note: ${note}`} onRemove={() => updateParam({ note: '' })} />}
          {brand && <FilterChip label={`Brand: ${brand}`} onRemove={() => updateParam({ brand: '' })} />}
          {availability && <FilterChip label="In Stock Only" onRemove={() => updateParam({ availability: '' })} />}
        </div>
      )}

      {/* ── Product Grid ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="bag"
          title="No products found"
          description="Try adjusting your filters or search term"
          actionLabel="Clear filters"
          onAction={clearAllFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParam({ page: String(i + 1) })}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    page === i + 1 ? 'bg-black text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', fontSize: 12,
      border: '1px solid #0c0c0c', borderRadius: 100,
      background: '#0c0c0c', color: '#fff',
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: 0 }}>
        <X size={10} />
      </button>
    </span>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
