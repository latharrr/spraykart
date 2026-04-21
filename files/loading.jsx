// app/loading.jsx
// Shown instantly while any page-level async work happens.
// Next.js streams this to the browser in <1ms — eliminates blank-white flashes.

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Hero skeleton */}
      <div style={{ background: '#0c0c0c', minHeight: 'calc(100vh - 88px)', display: 'flex', alignItems: 'center', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: 480 }}>
            <div className="skeleton" style={{ height: 12, width: 200, marginBottom: 32, background: 'rgba(255,255,255,0.1)', animation: 'none', opacity: 0.3 }} />
            <div className="skeleton" style={{ height: 80, width: '80%', marginBottom: 16, background: 'rgba(255,255,255,0.1)', animation: 'none', opacity: 0.2 }} />
            <div className="skeleton" style={{ height: 80, width: '60%', marginBottom: 32, background: 'rgba(255,255,255,0.1)', animation: 'none', opacity: 0.2 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="skeleton" style={{ height: 48, width: 180, background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
              <div className="skeleton" style={{ height: 48, width: 120, background: 'rgba(255,255,255,0.08)', animation: 'none' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Product grid skeleton */}
      <div style={{ padding: '96px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="featured-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3/5', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
