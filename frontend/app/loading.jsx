// app/loading.jsx
// Shown instantly while any page-level async work happens.
// Matches actual page layout to prevent Cumulative Layout Shift (CLS).

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Hero skeleton — matches hero-desktop aspect ratio ~600/1400 = 42.8% */}
      <div
        className="hidden md:block skeleton"
        style={{ width: '100%', paddingBottom: '42.8%', background: '#F6F4EF' }}
      />
      {/* Hero skeleton — mobile aspect ratio ~1200/900 = 133% */}
      <div
        className="block md:hidden skeleton"
        style={{ width: '100%', paddingBottom: '133%', background: '#F6F4EF' }}
      />

      {/* Featured products skeleton */}
      <div style={{ padding: '96px 40px', maxWidth: 1280, margin: '0 auto' }} className="section-inner" >
        {/* Section heading skeleton */}
        <div style={{ marginBottom: 56, borderBottom: '1px solid #E2DFD8', paddingBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="skeleton" style={{ height: 10, width: 120, marginBottom: 12, borderRadius: 0 }} />
            <div className="skeleton" style={{ height: 36, width: 260, borderRadius: 0 }} />
          </div>
          <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 0 }} />
        </div>

        {/* Product card grid skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="featured-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 0, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 8, borderRadius: 0 }} />
              <div className="skeleton" style={{ height: 16, width: '85%', marginBottom: 8, borderRadius: 0 }} />
              <div className="skeleton" style={{ height: 16, width: '50%', borderRadius: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
