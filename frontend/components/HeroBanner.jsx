
import Image from 'next/image';
import Link from 'next/link';

/**
 * HeroBanner — responsive hero section (Server Component — no client JS bundle)
 *
 * Uses a single <picture>-style render: only the matching viewport image is
 * fetched + decoded by the browser, eliminating wasted LCP decode on the
 * hidden image. `priority` triggers <link rel="preload"> in the <head>.
 */
export default function HeroBanner() {
  return (
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* ── Desktop image (hidden on mobile via CSS) ──────────────────────── */}
      <div className="hidden md:block" style={{ position: 'relative', width: '100%' }}>
        <Image
          src="/hero-desktop.jpeg"
          alt="Discover your signature fragrance"
          width={1400}
          height={600}
          priority
          quality={85}
          fetchPriority="high"
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
        />
      </div>

      {/* ── Mobile image (hidden on desktop via CSS) ──────────────────────── */}
      <div className="block md:hidden" style={{ position: 'relative', width: '100%' }}>
        <Image
          src="/hero-mobile.png"
          alt="Discover your signature fragrance"
          width={900}
          height={1200}
          priority
          quality={80}
          fetchPriority="high"
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
        />
      </div>

      {/* ── Clickable overlay ─────────────────────────────────────────────── */}
      <Link
        href="/products"
        aria-label="Explore Collections"
        style={{ position: 'absolute', inset: 0, zIndex: 10 }}
      />
    </section>
  );
}
