// app/admin/loading.jsx
export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="w-60 bg-gray-950 shrink-0" />

      {/* Main skeleton */}
      <main className="flex-1 p-8 animate-pulse">
        <div className="h-8 skeleton rounded w-40 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-4 skeleton rounded w-1/2 mb-3" />
              <div className="h-8 skeleton rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 h-64" />
          ))}
        </div>
      </main>
    </div>
  );
}
