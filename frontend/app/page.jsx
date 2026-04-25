import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Gift, Star, Phone, BadgeCheck } from 'lucide-react';
import db from '@/lib/db';
import cache from '@/lib/cache';

// Keep homepage statically rendered and refresh periodically.
export const dynamic = 'force-static';
export const revalidate = 1800;

async function getFeaturedProducts() {
  try {
    const cached = await cache.get('products:featured:home');
    if (cached) return cached;

    const { rows } = await db.query(`
      WITH featured AS (
        SELECT *
        FROM products
        WHERE is_active = true AND is_featured = true
        ORDER BY created_at DESC
        LIMIT 8
      )
      SELECT featured.*,
        (
          SELECT url FROM product_images
          WHERE product_id = featured.id AND is_primary = true
          LIMIT 1
        ) AS image,
        (
          SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) FROM reviews
          WHERE product_id = featured.id AND is_approved = true
        ) AS avg_rating,
        (
          SELECT COUNT(id) FROM reviews
          WHERE product_id = featured.id AND is_approved = true
        ) AS review_count
      FROM featured
      ORDER BY featured.created_at DESC
    `);

    await cache.set('products:featured:home', rows, 1800);
    return rows;
  } catch (err) {
    console.error('Failed to fetch featured products:', err);
    return [];
  }
}

export const metadata = {
  title: 'Spraykart — Luxury Fragrances at Accessible Prices',
  description: "India's most trusted luxury fragrance platform. 100% authentic perfumes, attars & niche fragrances. Pan-India delivery.",
};

const trustPillars = [
  { icon: BadgeCheck, title: 'Best Value',       desc: 'Luxury fragrances at accessible prices — up to 40% off MRP' },
  { icon: Star,       title: 'Premium Quality',  desc: 'Handcrafted with the finest ingredients from global distilleries' },
  { icon: Truck,      title: 'Fast Delivery',    desc: 'Quick pan-India shipping in secure, tamper-proof packaging' },
  { icon: ShieldCheck,title: '100% Authentic',   desc: 'Three-level authenticity verification on every product' },
  { icon: Gift,       title: 'Perfect Gift',     desc: 'Premium gift-ready packaging for every occasion' },
  { icon: Phone,      title: '24/7 Support',     desc: 'Fragrance experts available round the clock' },
];

const categories = [
  { label: 'Men',       href: '/products?category=Men' },
  { label: 'Women',     href: '/products?category=Women' },
  { label: 'Unisex',    href: '/products?category=Unisex' },
  { label: 'Attar',     href: '/products?category=Attar' },
  { label: 'Gift Sets', href: '/products?category=Gift+Sets' },
];

const testimonials = [
  { name: 'Ananya Sharma', city: 'Mumbai',    rating: 5, text: 'Finally found 100% authentic luxury fragrances online! The scent lasts all day and packaging was flawless. Spraykart is my go-to now.' },
  { name: 'Rahul Mehta',   city: 'Bangalore', rating: 5, text: 'Ordered a Creed fragrance — arrived in 2 days with GST invoice and authenticity certificate. Everything was perfect.' },
  { name: 'Priya Nair',    city: 'Chennai',   rating: 5, text: 'Their expert helped me pick the right attar for my wedding. Exceptional service and outstanding product quality.' },
];

const faqs = [
  { q: 'Are the fragrances 100% authentic?',   a: 'Yes. Every product undergoes source verification, product inspection (packaging, batch codes), and a final pre-listing authenticity check by our experts.' },
  { q: 'What are the shipping timelines?',      a: 'Standard delivery: 3–7 business days. Pan-India coverage including tier-2 and tier-3 cities. Free shipping on orders above ₹999.' },
  { q: 'What payment methods do you accept?',  a: "We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), net banking, and wallets via Razorpay — India's most trusted payment gateway." },
  { q: 'How do I track my order?',             a: 'Once dispatched, you will receive an email with tracking details. You can also track your order from the Orders page in your account.' },
  { q: 'What is your return policy?',          a: 'We accept returns for damaged, defective, or wrong products within 48 hours of delivery. Contact support@spraykart.in with your order ID and photos.' },
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{ background: '#0c0c0c', minHeight: 'calc(100vh - 88px)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 48, right: 40, writingMode: 'vertical-rl', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', userSelect: 'none' }}>Est. 2024 &nbsp; India</div>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 40px', width: '100%' }} className="hero-padding">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="hero-grid">
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 1, background: 'rgba(255,255,255,.3)', display: 'inline-block' }} />
                100% Authentic · Pan-India Delivery
              </p>
              {/* h1 uses CSS variable — no FOUT, no layout shift */}
              <h1 className="hero-h1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(52px, 7vw, 96px)', fontWeight: 300, lineHeight: 1.02, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: 32 }}>
                Luxury<br />Fragrances.<br /><em style={{ fontStyle: 'italic', fontWeight: 300 }}>Accessible.</em>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', lineHeight: 1.8, maxWidth: 400, marginBottom: 44 }}>
                100% authentic perfumes, attars &amp; niche fragrances — sourced from authorized distributors.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#ffffff', color: '#0c0c0c', padding: '14px 32px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
                  Shop Collection <ArrowRight size={14} />
                </Link>
                <Link href="/products?category=Gift+Sets" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'transparent', color: 'rgba(255,255,255,.7)', padding: '13px 32px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.2)', textDecoration: 'none' }}>
                  Gift Sets
                </Link>
              </div>
            </div>
            <div className="hero-stats" style={{ borderLeft: '1px solid rgba(255,255,255,.08)', paddingLeft: 80 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px 32px' }}>
                {[['10,000+','Happy Customers'],['500+','Luxury Fragrances'],['100%','Authenticity Guaranteed'],['2-Day','Express Delivery']].map(([num, label]) => (
                  <div key={label}>
                    <p style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 44, fontWeight: 300, color: '#ffffff', lineHeight: 1, marginBottom: 8, letterSpacing: '-0.02em' }}>{num}</p>
                    <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 16 }}>Shop by category</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categories.map(({ label, href }) => (
                    <Link key={label} href={href} style={{ display: 'inline-block', padding: '6px 16px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', border: '1px solid rgba(255,255,255,.12)', textDecoration: 'none' }}>{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section style={{ background: '#ffffff', padding: '96px 0' }} className="section-padding">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="section-inner">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 56, borderBottom: '1px solid #f0f0f0', paddingBottom: 28 }}>
            <div>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', display: 'block', marginBottom: 8 }}>Curated Collection</span>
              <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>Featured Fragrances</h2>
            </div>
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', textDecoration: 'none', borderBottom: '1px solid #e8e8e8', paddingBottom: 2 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="featured-grid">
              {featuredProducts.map((p, i) => (
                // First 4 cards are above the fold — mark as priority for LCP
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="featured-grid">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST PILLARS ── */}
      <section style={{ background: '#f9f9f7', borderTop: '1px solid #eeeeee', padding: '96px 0' }} className="section-padding">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="section-inner">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 80, marginBottom: 64 }} className="trust-header">
            <div style={{ flexShrink: 0 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', display: 'block', marginBottom: 8 }}>Why Spraykart</span>
              <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>The Spraykart<br />Promise</h2>
            </div>
            <div style={{ flex: 1, paddingTop: 28, borderTop: '1px solid #e8e8e8' }}>
              <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.8, maxWidth: 480 }}>Every fragrance passes through our rigorous three-level verification system before reaching you.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #e8e8e8', borderLeft: '1px solid #e8e8e8' }} className="trust-grid">
            {trustPillars.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ padding: '40px 36px', borderBottom: '1px solid #e8e8e8', borderRight: '1px solid #e8e8e8', background: '#ffffff' }}>
                <div style={{ marginBottom: 20, color: '#0c0c0c' }}><Icon size={20} strokeWidth={1.5} /></div>
                <h3 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.03em', marginBottom: 8, color: '#0c0c0c' }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#909090', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: '#ffffff', padding: '96px 0' }} className="section-padding">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="section-inner">
          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 28, marginBottom: 56 }} className="reviews-header">
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', display: 'block', marginBottom: 8 }}>Reviews</span>
            <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>Loved Across India</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid #eeeeee', borderLeft: '1px solid #eeeeee' }} className="testimonials-grid">
            {testimonials.map(({ name, city, text, rating }) => (
              <div key={name} style={{ padding: '40px 36px', borderRight: '1px solid #eeeeee', borderBottom: '1px solid #eeeeee' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                  {[...Array(rating)].map((_, i) => <Star key={i} size={10} fill="#0c0c0c" stroke="none" />)}
                </div>
                <p style={{ fontSize: 15, color: '#3d3d3d', lineHeight: 1.75, marginBottom: 28, fontStyle: 'italic', fontFamily: 'var(--font-cormorant), Georgia, serif' }}>&ldquo;{text}&rdquo;</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0c0c0c' }}>{name}</p>
                <p style={{ fontSize: 11, color: '#a0a0a0', marginTop: 2, letterSpacing: '0.05em' }}>{city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#f9f9f7', borderTop: '1px solid #eeeeee', padding: '96px 0' }} className="section-padding">
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px' }} className="faq-inner">
          <div style={{ marginBottom: 56 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0a0a0', display: 'block', marginBottom: 8 }}>FAQ</span>
            <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>Common Questions</h2>
          </div>
          <div>
            {faqs.map(({ q, a }) => (
              <details key={q} style={{ borderTop: '1px solid #e8e8e8', cursor: 'pointer' }}>
                <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', fontSize: 14, fontWeight: 500, color: '#0c0c0c', listStyle: 'none', userSelect: 'none' }}>
                  {q}<span style={{ fontSize: 20, color: '#c8c8c8', flexShrink: 0, marginLeft: 24, lineHeight: 1 }}>+</span>
                </summary>
                <p style={{ fontSize: 13, color: '#737373', lineHeight: 1.8, paddingBottom: 20, paddingRight: 32 }}>{a}</p>
              </details>
            ))}
            <div style={{ borderTop: '1px solid #e8e8e8' }} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#0c0c0c', padding: '80px 40px', textAlign: 'center' }} className="cta-section">
        <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 24 }}>
          Free shipping above ₹999 · Razorpay Secured · Pan-India Delivery
        </p>
        <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: 40, lineHeight: 1.1 }}>
          Your Perfect Scent Awaits
        </h2>
        <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 40px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#ffffff', color: '#0c0c0c', textDecoration: 'none' }}>
          Explore Collection <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
