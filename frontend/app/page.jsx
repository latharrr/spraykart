import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import FadeUp from '@/components/FadeUp';
import WhyAccordion, { BrandScroll } from '@/components/WhyAccordion';
import db from '@/lib/db';
import cache from '@/lib/cache';
import logger from '@/lib/logger';
import { hasUsableDatabaseUrl } from '@/lib/env';

export const dynamic = 'force-static';
export const revalidate = 3600;

const HOME_FETCH_TIMEOUT_MS = 2500;

export const metadata = {
  title: 'Spraykart - Luxury Fragrances at Accessible Prices',
  description: "India's most trusted luxury fragrance platform. 100% authentic perfumes, attars & niche fragrances. Free shipping above ₹999. Pan-India delivery.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Spraykart - Luxury Fragrances at Accessible Prices',
    description: "India's most trusted luxury fragrance platform. 100% authentic perfumes, attars & niche fragrances.",
    url: '/',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Spraykart - Luxury Fragrances' }],
  },
};

function withHomeTimeout(promise, label) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${HOME_FETCH_TIMEOUT_MS}ms`));
    }, HOME_FETCH_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function getHomeCache(key) {
  try {
    return await withHomeTimeout(cache.get(key), `Cache read ${key}`);
  } catch (err) {
    logger.warn('Homepage cache read skipped:', err);
    return null;
  }
}

async function setHomeCache(key, value, ttl) {
  try {
    await withHomeTimeout(cache.set(key, value, ttl), `Cache write ${key}`);
  } catch (err) {
    logger.warn('Homepage cache write skipped:', err);
  }
}

async function getFeaturedProducts() {
  if (!hasUsableDatabaseUrl()) return [];

  try {
    const cached = await getHomeCache('products:featured:home');
    if (cached) return cached;

    const { rows } = await withHomeTimeout(db.query(`
      WITH featured AS (
        SELECT * FROM products WHERE is_active = true
        ORDER BY is_featured DESC, created_at DESC LIMIT 8
      )
      SELECT featured.*,
        (SELECT url FROM product_images WHERE product_id = featured.id AND is_primary = true LIMIT 1) AS image,
        (SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS avg_rating,
        (SELECT COUNT(id) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS review_count
      FROM featured ORDER BY featured.created_at DESC
    `), 'Featured products query');

    await setHomeCache('products:featured:home', rows, 3600);
    return rows;
  } catch (err) {
    logger.error('Failed to fetch featured products:', err);
    return [];
  }
}

const fallbackTestimonials = [
  { name: 'Ananya Sharma', city: 'Mumbai', rating: 5, text: 'Finally found 100% authentic luxury fragrances online. The scent lasts all day and packaging was flawless.' },
  { name: 'Rahul Mehta', city: 'Bangalore', rating: 5, text: 'Ordered a Creed fragrance and it arrived with a GST invoice and authenticity details. Perfect.' },
  { name: 'Priya Nair', city: 'Chennai', rating: 5, text: 'Their team helped me pick the right fragrance for a wedding gift. The service felt personal and premium.' },
];

async function getTestimonials() {
  if (!hasUsableDatabaseUrl()) return fallbackTestimonials;

  try {
    const cached = await getHomeCache('testimonials:home');
    if (cached) return cached;

    const { rows } = await withHomeTimeout(db.query(`
      SELECT name, location as city, rating, review as text
      FROM testimonials
      WHERE is_active = true
      ORDER BY sort_order ASC, created_at DESC
      LIMIT 3
    `), 'Testimonials query');
    const result = rows.length > 0 ? rows : fallbackTestimonials;

    await setHomeCache('testimonials:home', result, 3600);
    return result;
  } catch (err) {
    logger.error('Failed to fetch testimonials:', err);
    return fallbackTestimonials;
  }
}

const faqs = [
  { q: 'Are the fragrances 100% authentic?', a: 'Yes. Every product undergoes source verification, product inspection including packaging and batch codes, and a final pre-listing authenticity check by our experts.' },
  { q: 'What are the shipping timelines?', a: 'Standard delivery takes 3-7 business days. Spraykart ships pan-India, including tier-2 and tier-3 cities, with free shipping on orders above ₹999.' },
  { q: 'What payment methods do you accept?', a: "We accept major credit and debit cards, UPI, net banking, and wallets through Razorpay, India's trusted payment gateway." },
  { q: 'How do I track my order?', a: 'Once dispatched, you will receive tracking details by email. You can also track your order from the Orders page in your account.' },
  { q: 'What is your return policy?', a: 'We support returns for damaged, defective, or incorrect products. If something feels off, contact support with your order ID and product photos.' },
];

const trustItems = [
  { icon: '🧾', title: '100% Authentic', sub: 'Invoice + batch verified' },
  { icon: '🌍', title: 'Directly Exported', sub: 'International markets' },
  { icon: '⭐', title: 'Verified Reviews', sub: 'Real customers' },
  { icon: '🎁', title: 'Gift Hampers', sub: 'Curated sets' },
];

const microTrust = [
  { icon: '🏷', text: 'Invoice-backed originals' },
  { icon: '📦', text: 'Free shipping ₹999+' },
  { icon: '💬', text: 'WhatsApp support' },
];

const pledgeStats = [
  { number: '100%', label: 'Authentic Products' },
  { number: '7-Day', label: 'Free Returns' },
  { number: '10,000+', label: 'Happy Customers' },
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
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://spraykart.in/products?search={search_term_string}' }, 'query-input': 'required name=search_term_string' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

function Stars({ count = 5, className = '' }) {
  return (
    <span className={className} aria-label={`${count} star rating`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export default async function HomePage() {
  const [featuredProducts, testimonials] = await Promise.all([getFeaturedProducts(), getTestimonials()]);

  return (
    <div className="home-new">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="hero-new-grid home-container">
          <div className="home-hero-left">
            <p className="home-eyebrow-pill">✦ Invoice-Backed · Batch Verified · Exported Original</p>
            <h1 id="home-hero-title" className="home-hero-title">
              Luxury Fragrances.<br />
              <em>Real Prices.</em>
            </h1>
            <p className="home-hero-copy">
              Shop Dior, Creed, YSL, Maison Margiela — imported directly, verified by batch code, delivered pan-India.
            </p>
            <div className="home-cta-row">
              <Link href="/products" className="btn-dark">Shop Collection →</Link>
              <Link href="/fragrance-finder" className="btn-ghost-dark">Find My Scent</Link>
            </div>
            <div className="home-trust-micros" aria-label="Spraykart trust signals">
              {microTrust.map(({ icon, text }) => (
                <span key={text} className="home-micro-pill">
                  <span aria-hidden="true">{icon}</span>
                  {text}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-new-right" aria-hidden="true">
            <div className="home-hero-art">
              {/* TODO: replace with actual product/lifestyle image */}
              <div className="home-hero-art-glow" />
              <div className="home-hero-badge">
                <span className="home-hero-badge-kicker">UP TO</span>
                <span className="home-hero-badge-number">40% off MRP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-trust-strip" aria-label="Why customers trust Spraykart">
        <div className="trust-strip-new">
          {trustItems.map(({ icon, title, sub }, i) => (
            <FadeUp key={title} delay={i * 0.08} className="home-trust-card trust-item">
              <span className="home-trust-icon" aria-hidden="true">{icon}</span>
              <strong>{title}</strong>
              <span>{sub}</span>
            </FadeUp>
          ))}
        </div>
      </section>

      <section className="home-section home-featured-section" aria-labelledby="just-landed-title">
        <div className="home-container">
          <FadeUp className="home-section-header">
            <div>
              <span className="eyebrow">Fresh Stock</span>
              <h2 id="just-landed-title" className="section-h2">Just Landed</h2>
            </div>
            <Link href="/products" className="home-header-link">View all →</Link>
          </FadeUp>

          {featuredProducts.length > 0 ? (
            <div className="home-product-grid">
              {featuredProducts.map((product, i) => (
                <FadeUp key={product.id} delay={(i % 4) * 0.06}>
                  <ProductCard product={product} priority={i < 4} />
                </FadeUp>
              ))}
            </div>
          ) : (
            <FadeUp className="home-product-empty">
              Fresh stock is being refreshed. Explore the full collection for available perfumes.
            </FadeUp>
          )}

          <FadeUp className="home-center-action">
            <Link href="/products" className="btn-ghost-muted">Explore Full Collection →</Link>
          </FadeUp>
        </div>
      </section>

      <section className="home-why-section" aria-labelledby="why-spraykart-title">
        <div className="why-grid home-container">
          <FadeUp className="home-why-copy">
            <div className="home-why-sticky">
              <span className="eyebrow">Our Promise</span>
              <h2 id="why-spraykart-title" className="home-why-title">
                The perfume market is full of fakes.<br />
                <em>We&apos;re not.</em>
              </h2>
              <p>
                Every bottle we stock comes with a paper trail. That&apos;s not a marketing line — it&apos;s how we sleep at night.
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.12}>
            <WhyAccordion />
          </FadeUp>
        </div>
      </section>

      <section className="home-brand-section" aria-labelledby="shop-by-brand-title">
        <FadeUp>
          <h2 id="shop-by-brand-title" className="home-brand-title">Shop by Brand</h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <BrandScroll />
        </FadeUp>
      </section>

      <section className="home-social-section" aria-labelledby="social-proof-title">
        <div className="home-container">
          <FadeUp className="home-social-header">
            <Stars className="home-large-stars" />
            <p className="home-rating-copy">4.8 ★ from 10,000+ verified buyers</p>
            <h2 id="social-proof-title" className="section-h2">Don&apos;t take our word for it</h2>
          </FadeUp>

          <div className="home-reviews-grid">
            {testimonials.map(({ name, city, text, rating }, i) => {
              const starCount = Math.min(5, Math.max(4, Math.round(Number(rating) || 5)));

              return (
                <FadeUp key={`${name}-${city}`} delay={i * 0.1} className="home-review-card">
                  <Stars count={starCount} className="home-review-stars" />
                  <p className="home-review-quote">&ldquo;{text}&rdquo;</p>
                  <div className="home-review-footer">
                    <div>
                      <strong className="home-review-name">{name}</strong>
                      <span className="home-review-city">{city || 'India'}</span>
                    </div>
                    <span className="home-verified-badge">Verified Purchase ✓</span>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-gift-section" aria-labelledby="gift-title">
        <div className="gift-grid home-container">
          <FadeUp className="home-gift-copy">
            <span className="eyebrow">✦ Something Special</span>
            <h2 id="gift-title" className="home-gift-title">
              Gift Scent.<br />
              <em>Gift Memory.</em>
            </h2>
            <p>
              Curated gift hampers with original perfumes, premium packaging, and a personal note — for birthdays, anniversaries, or just because.
            </p>
            <Link href="/products?category=Gift+Sets" className="btn-dark">Explore Gift Sets →</Link>
          </FadeUp>
          <FadeUp delay={0.12} className="home-gift-image" aria-hidden="true">
            {/* TODO: replace with actual product/lifestyle image */}
            <span>Premium gift packaging</span>
          </FadeUp>
        </div>
      </section>

      <section className="home-pledge" aria-labelledby="pledge-title">
        <FadeUp>
          <span className="home-dark-eyebrow">Our Commitment</span>
          <h2 id="pledge-title" className="home-pledge-title">
            Every bottle. Every batch.<br />
            <em>Verified.</em>
          </h2>
          <p className="home-dark-copy">
            We don&apos;t sell anything we can&apos;t prove is real. That&apos;s not a policy — it&apos;s who we are.
          </p>
          <Link href="#faq" className="btn-ghost-light">See How We Verify →</Link>
        </FadeUp>
        <div className="home-pledge-stats pledge-stats">
          {pledgeStats.map(({ number, label }, i) => (
            <FadeUp key={label} delay={i * 0.08} className="home-pledge-stat">
              <strong>{number}</strong>
              <span>{label}</span>
            </FadeUp>
          ))}
        </div>
      </section>

      <section className="home-wa-strip wa-strip" aria-label="WhatsApp fragrance help">
        <div className="home-wa-left">
          <span className="home-wa-icon" aria-hidden="true">💬</span>
          <div>
            <p>Not sure which fragrance to pick?</p>
            <span>Our team is on WhatsApp — usually replies in 2 minutes.</span>
          </div>
        </div>
        <a
          href="https://wa.me/917217816676?text=Hi%2C+I+need+help+choosing+a+fragrance"
          target="_blank"
          rel="noopener noreferrer"
          className="home-wa-button"
        >
          Chat with Us
        </a>
      </section>

      <section id="faq" className="home-faq-section" aria-labelledby="faq-title">
        <div className="home-faq-inner">
          <FadeUp className="home-faq-header">
            <span className="eyebrow">FAQ</span>
            <h2 id="faq-title" className="section-h2">Common Questions</h2>
          </FadeUp>
          {faqs.map(({ q, a }, i) => (
            <FadeUp key={q} delay={Math.min(i * 0.05, 0.2)}>
              <details className="home-faq-item">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            </FadeUp>
          ))}
          <FadeUp className="home-faq-link-wrap">
            <Link href="/faq" className="home-header-link">View all FAQs →</Link>
          </FadeUp>
        </div>
      </section>

      <section className="home-final-cta" aria-labelledby="final-cta-title">
        <FadeUp>
          <span className="home-dark-eyebrow">Free shipping ₹999+ · Razorpay Secured · Pan-India Delivery</span>
          <h2 id="final-cta-title" className="home-final-title">
            Your Perfect Scent<br />
            <em>Awaits You</em>
          </h2>
          <div className="home-final-buttons">
            <Link href="/products" className="home-btn-light">Explore Collection →</Link>
            <Link href="/fragrance-finder" className="btn-ghost-light">Find Your Scent</Link>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
