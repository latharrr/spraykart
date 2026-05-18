import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import db from '@/lib/db';
import cache from '@/lib/cache';
import logger from '@/lib/logger';
import { hasUsableDatabaseUrl } from '@/lib/env';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata = {
  title: 'Spraykart — Luxury Fragrances at Accessible Prices',
  description: "India's most trusted luxury fragrance platform. 100% authentic perfumes, attars & niche fragrances. Free shipping above ₹999. Pan-India delivery.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Spraykart — Luxury Fragrances at Accessible Prices',
    description: "India's most trusted luxury fragrance platform. 100% authentic perfumes, attars & niche fragrances.",
    url: '/',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Spraykart - Luxury Fragrances' }],
  },
};

async function getFeaturedProducts() {
  if (!hasUsableDatabaseUrl()) return [];
  try {
    const cached = await cache.get('products:featured:home');
    if (cached) return cached;
    const { rows } = await db.query(`
      WITH featured AS (
        SELECT * FROM products WHERE is_active = true
        ORDER BY is_featured DESC, created_at DESC LIMIT 8
      )
      SELECT featured.*,
        (SELECT url FROM product_images WHERE product_id = featured.id AND is_primary = true LIMIT 1) AS image,
        (SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS avg_rating,
        (SELECT COUNT(id) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS review_count
      FROM featured ORDER BY featured.created_at DESC
    `);
    await cache.set('products:featured:home', rows, 1800);
    return rows;
  } catch (err) {
    logger.error('Failed to fetch featured products:', err);
    return [];
  }
}

async function getTestimonials() {
  const fallback = [
    { name: 'Ananya Sharma', city: 'Mumbai',    rating: 5, text: 'Finally found 100% authentic luxury fragrances online! The scent lasts all day and packaging was flawless.' },
    { name: 'Rahul Mehta',   city: 'Bangalore', rating: 5, text: 'Ordered a Creed fragrance — arrived in 2 days with GST invoice and authenticity certificate. Perfect.' },
    { name: 'Priya Nair',    city: 'Chennai',   rating: 5, text: 'Their expert helped me pick the right attar for my wedding. Exceptional service and outstanding quality.' },
  ];
  if (!hasUsableDatabaseUrl()) return fallback;
  try {
    const cached = await cache.get('testimonials:home');
    if (cached) return cached;
    const { rows } = await db.query(`SELECT name, location as city, rating, review as text FROM testimonials WHERE is_active = true ORDER BY sort_order ASC, created_at DESC LIMIT 3`);
    const result = rows.length > 0 ? rows : fallback;
    await cache.set('testimonials:home', result, 3600);
    return result;
  } catch (err) {
    logger.error('Failed to fetch testimonials:', err);
    return fallback;
  }
}

const faqs = [
  { q: 'Are the fragrances 100% authentic?',  a: 'Yes. Every product undergoes source verification, product inspection (packaging, batch codes), and a final pre-listing authenticity check by our experts.' },
  { q: 'What are the shipping timelines?',     a: 'Standard delivery: 3–7 business days. Pan-India coverage including tier-2 and tier-3 cities. Free shipping on orders above ₹999.' },
  { q: 'What payment methods do you accept?', a: "We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), net banking, and wallets via Razorpay — India's most trusted payment gateway." },
  { q: 'How do I track my order?',            a: 'Once dispatched, you will receive an email with tracking details. You can also track your order from the Orders page in your account.' },
  { q: 'What is your return policy?',         a: 'We accept returns for damaged, defective, or wrong products within 48 hours of delivery. Contact support@spraykart.in with your order ID and photos.' },
];

const categories = [
  { label: 'Men',       href: '/products?category=Men' },
  { label: 'Women',     href: '/products?category=Women' },
  { label: 'Unisex',    href: '/products?category=Unisex' },
  { label: 'Attar',     href: '/products?category=Attar' },
  { label: 'Gift Sets', href: '/products?category=Gift+Sets' },
];

const organizationSchema = {
  '@context': 'https://schema.org', '@type': 'Organization',
  name: 'Spraykart', url: 'https://spraykart.in', logo: 'https://spraykart.in/logo.png',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@spraykart.in', availableLanguage: ['English', 'Hindi'] },
};
const websiteSchema = {
  '@context': 'https://schema.org', '@type': 'WebSite',
  name: 'Spraykart', url: 'https://spraykart.in',
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://spraykart.in/products?search={search_term_string}' }, 'query-input': 'required name=search_term_string' },
};
const faqSchema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

export default async function HomePage() {
  const [featuredProducts, testimonials] = await Promise.all([getFeaturedProducts(), getTestimonials()]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ═══════════════════════════════════════════════════════ HERO ══ */}
      <section style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#0c0c0c' }}>
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-eyebrow">India&apos;s Premier Fragrance Destination</p>
            <h1 className="hero-h1">
              Luxury Fragrances<br />
              <em>for Every Occasion</em>
            </h1>
            <p className="hero-desc">
              100% authentic perfumes, attars &amp; niche fragrances — curated for the discerning Indian. Free shipping above ₹999.
            </p>
            <div className="hero-ctas">
              <Link href="/products" className="hero-btn-primary">
                Shop Now <ArrowRight size={13} />
              </Link>
              <Link href="/fragrance-finder" className="hero-btn-secondary">
                Find Your Scent
              </Link>
            </div>
          </div>
          <div className="hero-stats" aria-hidden="true">
            <div>
              <div className="hero-stat-num">10K+</div>
              <div className="hero-stat-label">Happy Customers</div>
            </div>
            <div>
              <div className="hero-stat-num">500+</div>
              <div className="hero-stat-label">Fragrances</div>
            </div>
            <div>
              <div className="hero-stat-num">100%</div>
              <div className="hero-stat-label">Authentic</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════ TRUST STRIP ══ */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 0 }} className="trust-strip-inner">
          {[
            { icon: '✦', label: '100% Authentic', sub: 'Verified products' },
            { icon: '◎', label: 'Free Shipping',  sub: 'Orders above ₹999' },
            { icon: '▲', label: 'Fast Delivery',  sub: '3–7 business days' },
            { icon: '◇', label: 'Secure Payment', sub: 'Razorpay & Paytm' },
            { icon: '○', label: '24/7 Support',   sub: 'Expert assistance' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="trust-strip-item">
              <span className="trust-strip-icon" style={{ color: '#0c0c0c' }}>{icon}</span>
              <div>
                <div className="trust-strip-text">{label}</div>
                <div className="trust-strip-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════ CATEGORIES ══ */}
      <section style={{ background: '#ffffff', padding: '48px 0 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="section-inner">
          <div className="cat-pills">
            <Link href="/products" className="cat-pill cat-pill-all">All Fragrances</Link>
            {categories.map(({ label, href }) => (
              <Link key={href} href={href} className="cat-pill">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ FEATURED PRODUCTS ══ */}
      <section style={{ background: '#ffffff', padding: '56px 0 88px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="section-inner">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <span className="section-label">Curated Collection</span>
              <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>
                Featured Fragrances
              </h2>
            </div>
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373', textDecoration: 'none', paddingBottom: 2, borderBottom: '1px solid #d0d0d0' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="featured-grid">
              {featuredProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="featured-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ aspectRatio: '3/4', background: '#f5f5f3' }} className="skeleton" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════ FRAGRANCE FINDER ══ */}
      <section style={{ background: '#0c0c0c', padding: '88px 40px' }} className="cta-section">
        <div className="finder-section">
          <span className="finder-eyebrow">Personalised for You</span>
          <h2 className="finder-h2">Not Sure What to<br /><em>Wear?</em></h2>
          <p className="finder-desc">
            Answer 5 quick questions and our quiz recommends the perfect fragrance for your occasion, mood and budget.
          </p>
          <Link href="/fragrance-finder" className="finder-btn">
            Take the Quiz <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════ THE SPRAYKART PROMISE ══ */}
      <section style={{ background: '#f9f9f7', borderTop: '1px solid #eeeeee', padding: '88px 0' }} className="section-padding">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="section-inner">
          <div style={{ marginBottom: 52 }}>
            <span className="section-label">Why Spraykart</span>
            <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>
              The Spraykart Promise
            </h2>
          </div>
          <div className="promise-grid">
            {[
              { num: '01', title: 'Best Value',        desc: "Luxury fragrances at accessible prices — curated from the world's finest houses, up to 40% off MRP." },
              { num: '02', title: '100% Authentic',    desc: 'Every product passes our rigorous three-level authentication: source, inspection, and pre-listing verification.' },
              { num: '03', title: 'Fast & Safe Delivery', desc: 'Pan-India delivery in 3–7 business days. Tamper-proof packaging, real-time tracking, and free shipping above ₹999.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="promise-item">
                <div className="promise-num">{num}</div>
                <h3 className="promise-title">{title}</h3>
                <p className="promise-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ TESTIMONIALS ══ */}
      <section style={{ background: '#ffffff', padding: '88px 0' }} className="section-padding">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }} className="section-inner">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 44 }}>
            <div>
              <span className="section-label">Customer Reviews</span>
              <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>
                Loved Across India
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0,1,2,3,4].map((i) => <Star key={i} size={12} fill="#0c0c0c" stroke="none" />)}
              <span style={{ fontSize: 11, color: '#737373', marginLeft: 8, letterSpacing: '0.04em' }}>4.9 / 5</span>
            </div>
          </div>
          <div className="testimonials-grid-new">
            {testimonials.map(({ name, city, text, rating }) => (
              <div key={name} className="testimonial-card">
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(rating || 5)].map((_, i) => <Star key={i} size={10} fill="#0c0c0c" stroke="none" />)}
                </div>
                <p className="testimonial-quote">&ldquo;{text}&rdquo;</p>
                <div className="testimonial-meta">
                  <div>
                    <div className="testimonial-name">{name}</div>
                    <div className="testimonial-city">{city}</div>
                  </div>
                  <span style={{ fontSize: 28, color: '#e8e8e8', fontFamily: 'Georgia, serif', lineHeight: 1 }}>&ldquo;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ FAQ ══ */}
      <section style={{ background: '#f9f9f7', borderTop: '1px solid #eeeeee', padding: '88px 0' }} className="section-padding">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 40px' }} className="faq-inner">
          <div style={{ marginBottom: 48 }}>
            <span className="section-label">Common Questions</span>
            <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>
              Frequently Asked
            </h2>
          </div>
          {faqs.map(({ q, a }) => (
            <details key={q} className="faq-item">
              <summary>
                {q}
                <span className="faq-plus">+</span>
              </summary>
              <p className="faq-answer">{a}</p>
            </details>
          ))}
          <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid #eeeeee', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#737373' }}>Have more questions?</span>
            <Link href="/faq" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0c0c0c', textDecoration: 'none', borderBottom: '1px solid #0c0c0c', paddingBottom: 1 }}>
              View All FAQs
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ FINAL CTA ══ */}
      <section style={{ background: '#0c0c0c', padding: '88px 40px', textAlign: 'center' }} className="cta-section">
        <span className="final-cta-label">Free shipping above ₹999 · Razorpay Secured · Pan-India Delivery</span>
        <h2 className="final-cta-h2">Your Perfect Scent<br /><em>Awaits You</em></h2>
        <div className="final-cta-btns">
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 40px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: '#ffffff', color: '#0c0c0c', textDecoration: 'none' }}>
            Explore Collection <ArrowRight size={13} />
          </Link>
          <Link href="/fragrance-finder" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 40px', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'transparent', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            Find Your Scent
          </Link>
        </div>
      </section>
    </>
  );
}
