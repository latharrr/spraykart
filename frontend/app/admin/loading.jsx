export default function AdminLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', padding: '40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Stats row skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 2 }} />
          ))}
        </div>
        {/* Table skeleton */}
        <div className="skeleton" style={{ height: 400, borderRadius: 2 }} />
      </div>
    </div>
  );
}
