import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <picture>
        <source media="(min-width: 768px)" srcSet="/hero-desktop.webp" width="1400" height="600" />
        <img
          src="/hero-mobile.webp"
          alt="Discover your signature fragrance"
          width="900"
          height="1200"
          fetchPriority="high"
          decoding="async"
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
        />
      </picture>

      <Link
        href="/products"
        aria-label="Explore Collections"
        style={{ position: 'absolute', inset: 0, zIndex: 10 }}
      />
    </section>
  );
}
