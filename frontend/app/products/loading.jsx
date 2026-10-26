export default function ProductsLoading() {
  return (
    <div className="h-wrap" style={{ paddingBlock: '64px 120px' }} aria-busy="true" aria-label="Loading fragrances">
      <div className="skeleton" style={{ height: 88, width: '38%', marginBottom: 56 }} />
      <div className="h-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ display: 'grid', gap: 12 }}>
            <div className="skeleton" style={{ aspectRatio: '4 / 5' }} />
            <div className="skeleton" style={{ height: 10, width: '40%' }} />
            <div className="skeleton" style={{ height: 14, width: '70%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
