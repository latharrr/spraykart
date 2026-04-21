'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

const CATEGORIES = ['Men', 'Women', 'Unisex', 'Attar', 'Gift Sets'];
const SORTS = [
  { label: 'Newest', value: 'created_at:DESC' },
  { label: 'Price: Low to High', value: 'price:ASC' },
  { label: 'Price: High to Low', value: 'price:DESC' },
  { label: 'Name A–Z', value: 'name:ASC' },
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

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'created_at:DESC';
  const [sortField, sortOrder] = sortParam.split(':');

  const updateParam = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page'); // Reset page on filter change
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getProducts({ category, search, sort: sortField, order: sortOrder, page, limit: 12 });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      // Triple-guard: always coerce to string — never store an object in error state
      // (React error #31 fires if an object reaches JSX as a child)
      const msg =
        (typeof err === 'string' ? err : null) ||
        (typeof err?.error === 'string' ? err.error : null) ||
        (typeof err?.message === 'string' ? err.message : null) ||
        'Failed to load products. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [category, search, sortField, sortOrder, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
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
              onChange={(e) => updateParam('sort', e.target.value)}
            >
              {SORTS.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn-secondary text-sm py-2 gap-2"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      {/* Filters (expandable) */}
      {showFilters && (
        <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
          <p className="text-sm font-medium text-gray-700">Category:</p>
          <button
            onClick={() => updateParam('category', '')}
            className={`text-sm px-3 py-1.5 rounded-full border transition ${!category ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400'}`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateParam('category', cat === category ? '' : cat)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${category === cat ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          className="input max-w-sm text-sm"
          placeholder="Search products..."
          defaultValue={search}
          onChange={(e) => {
            clearTimeout(window._searchTimeout);
            window._searchTimeout = setTimeout(() => updateParam('search', e.target.value), 400);
          }}
        />
      </div>

      {/* Grid */}
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
          onAction={() => router.push('/products')}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParam('page', String(i + 1))}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    page === i + 1
                      ? 'bg-black text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
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
