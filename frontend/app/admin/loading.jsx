export default function AdminLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-32 skeleton rounded" />
        <div className="hidden sm:block h-4 w-44 skeleton rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 skeleton rounded w-24 mb-3" />
                <div className="h-9 skeleton rounded w-28 mb-2" />
                <div className="h-3 skeleton rounded w-32" />
              </div>
              <div className="w-10 h-10 skeleton rounded-xl" />
            </div>
            <div className="h-3 skeleton rounded w-20 mt-5" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, panelIndex) => (
          <div key={panelIndex} className="card p-6">
            <div className="h-5 skeleton rounded w-36 mb-5" />
            <div className="space-y-4">
              {[...Array(panelIndex === 0 ? 5 : 4)].map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-3">
                  <div className="h-8 w-8 skeleton rounded-full shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 skeleton rounded w-3/4 mb-2" />
                    <div className="h-3 skeleton rounded w-1/2" />
                  </div>
                  <div className="h-4 skeleton rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
