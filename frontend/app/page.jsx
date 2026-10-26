import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import HomeHero from '@/components/home/HomeHero';
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
        (SELECT url FROM product_images WHERE product_id = featured.id AND is_primary = false ORDER BY sort_order ASC LIMIT 1) AS second_image,
        (SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS avg_rating,
        (SELECT COUNT(id) FROM reviews WHERE product_id = featured.id AND is_approved = true) AS review_count
      FROM featured ORDER BY featured.is_featured DESC, featured.created_at DESC
    `), 'Featured products query');

    await setHomeCache('products:featured:home', rows, 3600);
    return rows;
  } catch (err) {
    logger.error('Failed to fetch featured products:', err);
    return [];
  }
}

async function getTestimonials() {
  if (!hasUsableDatabaseUrl()) return [];

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
    const result = rows;

    await setHomeCache('testimonials:home', result, 3600);
    return result;
  } catch (err) {
    logger.error('Failed to fetch testimonials:', err);
    return [];
  }
}

async function getHomeHeroImage() {
  if (!hasUsableDatabaseUrl()) return null;

  try {
    const cached = await getHomeCache('homepage:hero-image');
    if (cached) return cached;

    const { rows } = await withHomeTimeout(db.query(
      `SELECT url, alt
       FROM homepage_assets
       WHERE key = $1
       LIMIT 1`,
      ['hero_desktop']
    ), 'Homepage hero image query');
    const heroImage = rows[0] || null;

    await setHomeCache('homepage:hero-image', heroImage, 3600);
    return heroImage;
  } catch (err) {
    logger.warn('Homepage hero image skipped:', err);
    return null;
  }
}

async function getDepartmentImages() {
  if (!hasUsableDatabaseUrl()) return {};

  try {
    const cached = await getHomeCache('homepage:departments');
    if (cached) return cached;

    const { rows } = await withHomeTimeout(db.query(`
      SELECT DISTINCT ON (p.category) p.category, i.url
      FROM products p
      JOIN product_images i ON i.product_id = p.id AND i.is_primary = true
      WHERE p.is_active = true
      ORDER BY p.category, p.is_featured DESC, p.created_at DESC
    `), 'Department images query');
    const result = Object.fromEntries(rows.map((r) => [r.category, r.url]));

    await setHomeCache('homepage:departments', result, 3600);
    return result;
  } catch (err) {
    logger.warn('Department images skipped:', err);
    return {};
  }
}

const departments = [
  { category: 'Men', title: 'Men', line: 'Fougères, woods and leather from the houses that defined them.', fallback: 'Unisex' },
  { category: 'Women', title: 'Women', line: 'Florals, ambers and gourmands, from the icons to the new names.', fallback: 'Unisex' },
  { category: 'Attar', title: 'Attar', line: 'Perfume oils without alcohol: oud, rose and musk, worn close to the skin.' },
  { category: 'Gift Sets', title: 'Gifts', line: 'Discovery sets and boxed bottles, ready to give.' },
];

const faqs = [
  { q: 'Are the fragrances original?', a: 'Yes. Every bottle is sourced as an original, its batch code is checked before listing, and every order ships with a GST invoice.' },
  { q: 'How long does delivery take?', a: 'Standard delivery takes 3 to 7 business days across India, including tier-2 and tier-3 cities. Delivery is free above ₹999.' },
  { q: 'Which payment methods can I use?', a: 'UPI, credit and debit cards, net banking and wallets through Razorpay, plus cash on delivery where available.' },
  { q: 'What is a decant?', a: 'A decant is the same original perfume, poured from a sealed bottle into a 10 ml atomiser. It lets you wear a scent for a week or two before buying the full bottle.' },
  { q: 'Can I return a fragrance?', a: 'Damaged, defective or incorrect items can be returned within 7 days. Write to support with your order ID and photos and we will make it right.' },
];

const proof = [
  { title: 'Originals only', body: 'Sourced as originals and batch-code checked before they are listed.' },
  { title: 'GST invoice', body: 'Every order ships with a tax invoice in your name.' },
  { title: 'Free delivery over ₹999', body: 'Across India, with tracking from dispatch to door.' },
  { title: '7-day returns', body: 'For anything damaged, defective or not what you ordered.' },
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

function splitNotes(value) {
  return String(value || '').split(',').map((n) => n.trim()).filter(Boolean).join(', ');
}

export default async function HomePage() {
  const [featuredProducts, testimonials, homeHeroImage, deptImages] = await Promise.all([
    getFeaturedProducts(),
    getTestimonials(),
    getHomeHeroImage(),
    getDepartmentImages(),
  ]);

  const looks = featuredProducts.filter((p) => p.image).slice(0, 3);
  const arrivals = featuredProducts.slice(0, 8);
  const attar = featuredProducts.find((p) => p.category === 'Attar' && p.image);
  const houseImage = homeHeroImage?.url || featuredProducts.find((p) => p.category === 'Gift Sets' && p.image)?.image || featuredProducts[3]?.image;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {looks.length > 0 ? (
        <HomeHero looks={looks} />
      ) : (
        <section className="h-wrap h-section">
          <h1 className="t-display t-hero">Designer, niche and attar.</h1>
          <Link href="/products" className="h-btn" style={{ marginTop: 40 }}>Shop fragrances</Link>
        </section>
      )}

      <nav className="hp-depts" aria-label="Departments">
        {departments.map((d) => {
          const img = deptImages[d.category] || (d.fallback && deptImages[d.fallback]);
          return (
            <Link key={d.category} href={`/products?category=${encodeURIComponent(d.category)}`} className="hp-dept">
              <div className="hp-dept__img">
                {img && <Image src={img} alt="" fill sizes="(max-width: 599px) 38vw, (max-width: 1023px) 50vw, 25vw" style={{ objectFit: 'cover' }} />}
              </div>
              <div className="hp-dept__copy">
                <h2 className="t-display t-m">{d.title}</h2>
                <p className="t-small t-mute">{d.line}</p>
                <span className="h-link">Shop {d.title.toLowerCase()} <ArrowRight size={14} strokeWidth={1.25} /></span>
              </div>
            </Link>
          );
        })}
      </nav>

      {arrivals.length > 0 && (
        <section className="h-wrap h-section" aria-labelledby="arrivals-title">
          <div className="hp-head">
            <h2 id="arrivals-title" className="t-display t-xl">New to the house</h2>
            <Link href="/products" className="h-link">All fragrances <ArrowRight size={14} strokeWidth={1.25} /></Link>
          </div>
          <div className="h-grid">
            {arrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {attar && (
        <section className="hp-look h-inverse" aria-labelledby="attar-title">
          <div className="hp-look__img">
            <Image src={attar.image} alt={attar.name} fill sizes="(max-width: 1023px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          </div>
          <div className="hp-look__copy">
            <h2 id="attar-title" className="t-display t-xl">{attar.name}</h2>
            <p className="t-body" style={{ color: 'var(--on-ink-2)' }}>
              Attar is perfume in its oldest Indian form: concentrated oil, no alcohol, warmed by the skin. It sits on the same shelf here as Dior and Creed, because it belongs there.
            </p>
            {(attar.top_notes || attar.heart_notes || attar.base_notes) && (
              <dl className="hp-notes">
                {attar.top_notes && (<><dt>Top</dt><dd>{splitNotes(attar.top_notes)}</dd></>)}
                {attar.heart_notes && (<><dt>Heart</dt><dd>{splitNotes(attar.heart_notes)}</dd></>)}
                {attar.base_notes && (<><dt>Base</dt><dd>{splitNotes(attar.base_notes)}</dd></>)}
              </dl>
            )}
            <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href={`/products/${attar.slug}`} className="h-btn h-btn--light">View the attar</Link>
              <Link href="/products?category=Attar" className="h-link">All attars <ArrowRight size={14} strokeWidth={1.25} /></Link>
            </div>
          </div>
        </section>
      )}

      <section className="h-wrap h-section" aria-labelledby="try-title">
        <div className="hp-split">
          <h2 id="try-title" className="t-display t-xl">Wear it for a week before the bottle.</h2>
          <div style={{ display: 'grid', gap: 28, alignContent: 'end' }}>
            <p className="t-body t-mute" style={{ maxWidth: '52ch' }}>
              Most bottles here come as a 10 ml decant: the same original perfume, poured from a sealed bottle into a travel atomiser. Live with it, then buy the full size. Or answer five questions and let the finder shortlist for you.
            </p>
            <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/fragrance-finder" className="h-btn">Take the finder</Link>
              <Link href="/products?category=Gift+Sets" className="h-link">Discovery sets <ArrowRight size={14} strokeWidth={1.25} /></Link>
            </div>
            <dl className="hp-proof">
              {proof.map((p) => (
                <div key={p.title}>
                  <dt className="t-label-l">{p.title}</dt>
                  <dd className="t-small t-mute">{p.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {houseImage && (
        <section className="hp-look hp-look--flip" aria-labelledby="gift-title" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="hp-look__img">
            <Image src={houseImage} alt={homeHeroImage?.alt || 'Spraykart gift set'} fill sizes="(max-width: 1023px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          </div>
          <div className="hp-look__copy">
            <h2 id="gift-title" className="t-display t-xl">For someone else.</h2>
            <p className="t-body t-mute">Weddings, birthdays, Diwali. Choose a boxed bottle or a discovery set, add a note at checkout, and it arrives ready to give. Not sure what they wear? Ask an advisor on WhatsApp.</p>
            <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/products?category=Gift+Sets" className="h-btn">Shop gifts</Link>
              <a href="https://wa.me/917217816676?text=Hi%2C%20I%20need%20help%20choosing%20a%20gift" target="_blank" rel="noopener noreferrer" className="h-link">Ask an advisor <ArrowRight size={14} strokeWidth={1.25} /></a>
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="h-inverse h-section" aria-labelledby="voices-title">
          <div className="h-wrap">
            <h2 id="voices-title" className="t-display t-xl" style={{ marginBottom: 'clamp(36px, 4vw, 64px)' }}>In their words</h2>
            <div className="hp-voices">
              {testimonials.slice(0, 3).map(({ name, city, text }) => (
                <figure key={`${name}-${city}`} className="hp-voice">
                  <blockquote>{text}</blockquote>
                  <figcaption className="t-label" style={{ color: 'var(--on-ink-2)' }}>{name}{city ? `, ${city}` : ''}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="faq" className="h-wrap h-section" aria-labelledby="faq-title">
        <div className="hp-split">
          <div>
            <h2 id="faq-title" className="t-display t-xl">Questions</h2>
            <Link href="/faq" className="h-link" style={{ marginTop: 28 }}>All questions <ArrowRight size={14} strokeWidth={1.25} /></Link>
          </div>
          <div>
            {faqs.map(({ q, a }) => (
              <details key={q} className="h-acc">
                <summary>{q}</summary>
                <p className="h-acc__body t-body t-mute" style={{ maxWidth: '62ch' }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
