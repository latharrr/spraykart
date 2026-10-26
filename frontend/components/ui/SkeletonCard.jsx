export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-none overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton rounded-none w-3/4" />
        <div className="h-3 skeleton rounded-none w-1/4" />
        <div className="h-5 skeleton rounded-none w-1/2 mt-3" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 skeleton rounded-none w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonProductPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
      <div className="aspect-square skeleton rounded-none" />
      <div className="space-y-4">
        <div className="h-8 skeleton rounded-none w-2/3" />
        <div className="h-4 skeleton rounded-none w-1/3" />
        <div className="h-6 skeleton rounded-none w-1/4 mt-4" />
        <div className="space-y-2 mt-4">
          <div className="h-4 skeleton rounded-none" />
          <div className="h-4 skeleton rounded-none" />
          <div className="h-4 skeleton rounded-none w-4/5" />
        </div>
        <div className="h-12 skeleton rounded-none w-full mt-6" />
      </div>
    </div>
  );
}
