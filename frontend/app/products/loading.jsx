export default function ProductsLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', padding: '40px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>
        {/* Filter bar skeleton */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 36, width: 100, borderRadius: 2 }} />
          ))}
        </div>
        {/* Product grid skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="featured-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 2, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 16, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
