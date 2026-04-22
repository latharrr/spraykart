export default function OrdersLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', padding: '60px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 28, width: 180, marginBottom: 32 }} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 2, marginBottom: 16 }} />
        ))}
      </div>
    </div>
  );
}
