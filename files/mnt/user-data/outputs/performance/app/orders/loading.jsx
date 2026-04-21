// app/orders/loading.jsx
import { SkeletonRow } from '@/components/ui/SkeletonCard';

export default function OrdersLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="skeleton h-8 w-36 rounded mb-8" />
      <div className="card overflow-hidden animate-pulse">
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
