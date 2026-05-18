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
        SELECT * FROM products
        WHERE is_active = true
        ORDER BY is_featured DESC, created_at DESC
        LIMIT 8
      )
      SELECT featured.*,
        (SELECT url FROM product_images WHERE product_id = featured.id AND is_primary = true LIMIT 1) AS image,
        (SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS avg_rating,
        (SELECT COUNT(id) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS review_count
      FROM featured
      ORDER BY featured.created_at DESC
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
  { q: 'Are the fragrances 100% authentic?',   a: 'Yes. Every product undergoes source verification, product inspection (packaging, batch codes), and a final pre-listing authenticity check by our experts.' },
  { q: 'What are the shipping timelines?',      a: 'Standard delivery: 3–7 business days. Pan-India coverage including tier-2 and tier-3 cities. Free shipping on orders above ₹999.' },
  { q: 'What payment methods do you accept?',  a: "We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), net banking, and wallets via Razorpay — India's most trusted payment gateway." },
  { q: 'How do I track my order?',             a: 'Once dispatched, you will receive an email with tracking details. You can also track your order from the Orders page in your account.' },
  { q: 'What is your return policy?',          a: 'We accept returns for damaged, defective, or wrong products within 48 hours of delivery. Contact support@spraykart.in with your order ID and photos.' },
];

const categories = [
  { label: 'Men',       href: '/products?category=Men' },
  { label: 'Women',     href: '/products?category=Women' },
  { label: 'Unisex',    href: '/products?category=Unisex' },
  { label: 'Attar',     href: '/products?category=Attar' },
  { label: 'Gift Sets', href: '/products?category=Gift+Sets' },
];

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Spraykart',
  url: 'https://spraykart.in',
  logo: 'https://spraykart.in/logo.png',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@spraykart.in', availableLanguage: ['English', 'Hindi'] },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Spraykart',
  url: 'https://spraykart.in',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://spraykart.in/products?search={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
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
        <style>{`
          .hero-bg {
            position: absolute; inset: 0;
            background-image: url('/hero-desktop.webp'), url('/hero-desktop.jpeg');
            background-size: cover; background-position: center top; background-repeat: no-repeat;
          }
          @media (max-width: 767px) {
            .hero-bg { background-image: url('/hero-mobile.webp'), url('/hero-desktop.jpeg'); background-position: center; }
          }
          .hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(105deg, rgba(12,12,12,0.78) 0%, rgba(12,12,12,0.45) 55%, rgba(12,12,12,0.15) 100%);
          }
          @media (max-width: 767px) {
            .hero-overlay { background: linear-gradient(180deg, rgba(12,12,12,0.30) 0%, rgba(12,12,12,0.72) 60%, rgba(12,12,12,0.88) 100%); }
          }
          .hero-content {
            position: relative; z-index: 2;
            display: flex; align-items: flex-end; justify-content: space-between;
            max-width: 1280px; margin: 0 auto;
            padding: 80px 40px 64px;
            min-height: clamp(480px, 62vw, 680px);
          }
          @media (max-width: 767px) {
            .hero-content { padding: 40px 20px 48px; min-height: clamp(520px, 115vw, 660px); flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 0; }
          }
          .hero-text { max-width: 560px; }
          .hero-eyebrow {
            display: flex; align-items: center; gap: 12px;
            font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase;
            color: rgba(255,255,255,0.55); margin-bottom: 20px;
          }
          .hero-eyebrow::before { content: ''; width: 28px; height: 1px; background: rgba(255,255,255,0.4); display: block; }
          .hero-h1 {
            font-family: var(--font-cormorant), Georgia, serif;
            font-size: clamp(44px, 6vw, 80px);
            font-weight: 300; line-height: 1.03; letter-spacing: -0.02em;
            color: #ffffff; margin-bottom: 20px;
          }
          .hero-h1 em { font-style: italic; font-weight: 300; }
          .hero-desc {
            font-size: 13px; line-height: 1.75; color: rgba(255,255,255,0.6);
            max-width: 400px; margin-bottom: 36px;
          }
          .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
          .hero-btn-primary {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 14px 32px;
            background: #ffffff; color: #0c0c0c;
            font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
            text-decoration: none; transition: background .2s, color .2s;
          }
          .hero-btn-primary:hover { background: #f0f0f0; }
          .hero-btn-secondary {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 13px 32px;
            background: transparent; color: rgba(255,255,255,0.85);
            border: 1px solid rgba(255,255,255,0.35);
            font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
            text-decoration: none; transition: border-color .2s, color .2s;
          }
          .hero-btn-secondary:hover { border-color: rgba(255,255,255,0.7); color: #fff; }
          .hero-stats {
            display: flex; flex-direction: column; gap: 28px;
            align-items: flex-end; padding-bottom: 4px;
          }
          @media (max-width: 767px) { .hero-stats { display: none !important; } }
          .hero-stat-num {
            font-family: var(--font-cormorant), Georgia, serif;
            font-size: 36px; font-weight: 400; color: #ffffff; line-height: 1;
            letter-spacing: -0.02em;
          }
          .hero-stat-label {
            font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
            color: rgba(255,255,255,0.45); margin-top: 4px; text-align: right;
          }
        `}</style>

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
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', display: 'flex', gap: 0 }} className="trust-strip-inner">
          <style>{`
            .trust-strip-inner { padding: 0 40px !important; }
            @media (max-width: 767px) { .trust-strip-inner { padding: 0 !important; overflow-x: auto; scrollbar-width: none; } .trust-strip-inner::-webkit-scrollbar { display: none; } }
            .trust-strip-item {
              flex: 1; min-width: 160px;
              display: flex; align-items: center; gap: 10px;
              padding: 16px 20px;
              border-right: 1px solid #f0f0f0;
            }
            .trust-strip-item:last-child { border-right: none; }
            @media (max-width: 767px) { .trust-strip-item { flex: 0 0 auto; min-width: 200px; } }
            .trust-strip-icon { font-size: 15px; flex-shrink: 0; }
            .trust-strip-text { font-size: 11px; font-weight: 500; letter-spacing: 0.03em; color: #3d3d3d; }
            .trust-strip-sub { font-size: 10px; color: #a0a0a0; margin-top: 1px; }
          `}</style>
          {[
            { icon: '✦', label: '100% Authentic', sub: 'Verified products' },
            { icon: '◎', label: 'Free Shipping', sub: 'Orders above ₹999' },
            { icon: '▲', label: 'Fast Delivery', sub: '3–7 business days' },
            { icon: '◇', label: 'Secure Payment', sub: 'Razorpay & Paytm' },
            { icon: '○', label: '24/7 Support', sub: 'Expert assistance' },
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
          <style>{`
            .cat-pills { display: flex; gap: 8px; flex-wrap: wrap; }
            .cat-pill {
              display: inline-flex; align-items: center;
              padding: 9px 22px;
              border: 1px solid #e8e8e8;
              font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
              color: #3d3d3d; text-decoration: none;
              transition: background .18s, color .18s, border-color .18s;
              white-space: nowrap;
            }
            .cat-pill:hover { background: #0c0c0c; color: #ffffff; border-color: #0c0c0c; }
            .cat-pill-all { background: #0c0c0c; color: #ffffff; border-color: #0c0c0c; }
            .cat-pill-all:hover { background: #333; }
          `}</style>
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

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <span className="section-label">Curated Collection</span>
              <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, letterSpacing: '-0.01em', color: '#0c0c0c', lineHeight: 1 }}>
                Featured Fragrances
              </h2>
            </div>
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373', textDecoration: 'none', paddingBottom: 2, borderBottom: '1px solid #d0d0d0', transition: 'color .15s, border-color .15s' }}>
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
        <style>{`
          .finder-section { text-align: center; }
          .finder-eyebrow { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 20px; display: block; }
          .finder-h2 {
            font-family: var(--font-cormorant), Georgia, serif;
            font-size: clamp(32px, 5vw, 58px);
            font-weight: 300; letter-spacing: -0.02em;
            color: #ffffff; line-height: 1.08; margin-bottom: 16px;
          }
          .finder-h2 em { font-style: italic; }
          .finder-desc { font-size: 13px; color: rgba(255,255,255,0.45); max-width: 420px; margin: 0 auto 36px; line-height: 1.75; }
          .finder-btn {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 15px 40px;
            background: #ffffff; color: #0c0c0c;
            font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
            text-decoration: none; transition: background .2s;
          }
          .finder-btn:hover { background: #eeeeee; }
        `}</style>
        <div className="finder-section">
          <span className="finder-eyebrow">Personalised for You</span>
          <h2 className="finder-h2">
            Not Sure What to<br /><em>Wear?</em>
          </h2>
          <p className="finder-desc">
            Answer 5 quick questions and our AI-powered quiz recommends the perfect fragrance for your occasion, mood and budget.
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

          <style>{`
            .promise-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid #e4e4e4; }
            @media (max-width: 767px) { .promise-grid { grid-template-columns: 1fr; } }
            .promise-item {
              padding: 36px 32px 32px 0;
              border-right: 1px solid #e4e4e4;
              padding-right: 32px;
            }
            .promise-item:last-child { border-right: none; padding-right: 0; }
            @media (max-width: 767px) {
              .promise-item { padding: 28px 0; border-right: none; border-bottom: 1px solid #e4e4e4; }
              .promise-item:last-child { border-bottom: none; }
              .promise-grid { grid-template-columns: 1fr; }
            }
            .promise-num {
              font-family: var(--font-cormorant), Georgia, serif;
              font-size: 48px; font-weight: 300; color: #e8e8e8;
              line-height: 1; margin-bottom: 20px; letter-spacing: -0.03em;
            }
            .promise-title { font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #0c0c0c; margin-bottom: 10px; }
            .promise-desc { font-size: 13px; color: #737373; line-height: 1.75; }
          `}</style>

          <div className="promise-grid">
            {[
              { num: '01', title: 'Best Value', desc: 'Luxury fragrances at accessible prices — curated from the world\'s finest houses, up to 40% off MRP.' },
              { num: '02', title: '100% Authentic', desc: 'Every product passes our rigorous three-level authentication: source, inspection, and pre-listing verification.' },
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
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2,3,4].map((i) => <Star key={i} size={12} fill="#0c0c0c" stroke="none" />)}
              <span style={{ fontSize: 11, color: '#737373', marginLeft: 8, letterSpacing: '0.04em' }}>4.9 / 5</span>
            </div>
          </div>

          <style>{`
            .testimonials-grid-new { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            @media (max-width: 767px) { .testimonials-grid-new { grid-template-columns: 1fr; gap: 12px; } }
            .testimonial-card {
              background: #f9f9f7; padding: 36px 32px;
              border: 1px solid #eeeeee;
              display: flex; flex-direction: column; gap: 20px;
            }
            .testimonial-quote {
              font-family: var(--font-cormorant), Georgia, serif;
              font-size: 18px; font-style: italic; font-weight: 400;
              color: #1a1a1a; line-height: 1.65; flex: 1;
            }
            .testimonial-meta { display: flex; justify-content: space-between; align-items: flex-end; }
            .testimonial-name { font-size: 12px; font-weight: 700; color: #0c0c0c; letter-spacing: 0.04em; }
            .testimonial-city { font-size: 10px; color: #a0a0a0; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }
          `}</style>

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
          <style>{`
            .faq-item { border-top: 1px solid #e4e4e4; }
            .faq-item:last-of-type { border-bottom: 1px solid #e4e4e4; }
            .faq-item summary {
              display: flex; align-items: center; justify-content: space-between;
              padding: 20px 0; cursor: pointer; list-style: none;
              font-size: 14px; font-weight: 500; color: #0c0c0c;
              user-select: none; gap: 20px;
            }
            .faq-item summary::-webkit-details-marker { display: none; }
            .faq-item[open] summary .faq-plus { transform: rotate(45deg); }
            .faq-plus { font-size: 18px; color: #c0c0c0; flex-shrink: 0; transition: transform 0.2s; line-height: 1; }
            .faq-answer { font-size: 13px; color: #737373; line-height: 1.8; padding: 0 40px 20px 0; }
          `}</style>
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
        <style>{`
          .final-cta-label { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 20px; display: block; }
          .final-cta-h2 {
            font-family: var(--font-cormorant), Georgia, serif;
            font-size: clamp(36px, 5vw, 64px);
            font-weight: 300; color: #ffffff;
            letter-spacing: -0.02em; margin-bottom: 40px; line-height: 1.05;
          }
          .final-cta-h2 em { font-style: italic; }
          .final-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        `}</style>
        <span className="final-cta-label">Free shipping above ₹999 · Razorpay Secured · Pan-India Delivery</span>
        <h2 className="final-cta-h2">
          Your Perfect Scent<br /><em>Awaits You</em>
        </h2>
        <div className="final-cta-btns">
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 40px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: '#ffffff', color: '#0c0c0c', textDecoration: 'none', transition: 'background .2s' }}>
            Explore Collection <ArrowRight size={13} />
          </Link>
          <Link href="/fragrance-finder" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 40px', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'transparent', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}>
            Find Your Scent
          </Link>
        </div>
      </section>
    </>
  );
}
