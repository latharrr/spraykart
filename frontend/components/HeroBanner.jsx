'use client';
import Image from 'next/image';
import Link from 'next/link';

/**
 * HeroBanner — responsive hero section
 *
 * Setup:
 *   1. Copy laptop.jpeg  → public/hero-desktop.jpeg
 *   2. Copy phone.png    → public/hero-mobile.png
 *   3. Replace the existing <section> hero block in app/page.jsx with <HeroBanner />
 */
export default function HeroBanner() {
  return (
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* ── Desktop image (hidden on mobile) ─────────────────────────────── */}
      <div className="hidden md:block" style={{ position: 'relative', width: '100%' }}>
        <Image
          src="/hero-desktop.jpeg"
          alt="Discover your signature fragrance"
          width={1400}
          height={600}
          priority
          quality={90}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* ── Mobile image (hidden on desktop) ─────────────────────────────── */}
      <div className="block md:hidden" style={{ position: 'relative', width: '100%' }}>
        <Image
          src="/hero-mobile.png"
          alt="Discover your signature fragrance"
          width={900}
          height={1200}
          priority
          quality={90}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* ── Clickable overlay — links the whole banner to /products ──────── */}
      <Link
        href="/products"
        aria-label="Explore Collections"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
        }}
      />
    </section>
  );
}
