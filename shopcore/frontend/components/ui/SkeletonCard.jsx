export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/4" />
        <div className="h-5 skeleton rounded w-1/2 mt-3" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 skeleton rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonProductPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
      <div className="aspect-square skeleton rounded-xl" />
      <div className="space-y-4">
        <div className="h-8 skeleton rounded w-2/3" />
        <div className="h-4 skeleton rounded w-1/3" />
        <div className="h-6 skeleton rounded w-1/4 mt-4" />
        <div className="space-y-2 mt-4">
          <div className="h-4 skeleton rounded" />
          <div className="h-4 skeleton rounded" />
          <div className="h-4 skeleton rounded w-4/5" />
        </div>
        <div className="h-12 skeleton rounded-lg w-full mt-6" />
      </div>
    </div>
  );
}
