import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section
      aria-label="Discover your signature fragrance"
      style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#0c0c0c' }}
    >
      {/* Responsive background image — falls back to brand black if images are missing */}
      <style>{`
        .hero-bg {
          width: 100%;
          min-height: clamp(280px, 56.25vw, 600px);
          background-image: url('/hero-desktop.webp'), url('/hero-desktop.jpeg');
          background-size: cover;
          background-position: center top;
          background-repeat: no-repeat;
        }
        @media (max-width: 767px) {
          .hero-bg {
            min-height: clamp(420px, 100vw, 600px);
            background-image: url('/hero-mobile.webp'), url('/hero-desktop.jpeg');
          }
        }
      `}</style>
      <div className="hero-bg" />

      <Link
        href="/products"
        aria-label="Explore Collections"
        style={{ position: 'absolute', inset: 0, zIndex: 10 }}
      />
    </section>
  );
}
