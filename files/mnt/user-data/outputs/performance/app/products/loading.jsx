// app/products/loading.jsx
import SkeletonCard from '@/components/ui/SkeletonCard';

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="skeleton h-7 w-32 rounded mb-2" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-36 rounded" />
          <div className="skeleton h-10 w-24 rounded" />
        </div>
      </div>

      {/* Search skeleton */}
      <div className="mb-6">
        <div className="skeleton h-11 w-64 rounded" />
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(12)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
