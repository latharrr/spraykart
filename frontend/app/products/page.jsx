import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import ListingTools from '@/components/product/ListingTools';
import logger from '@/lib/logger';
import { SITE_URL } from '@/lib/env';
import { listProducts, listBrands, readListingParams } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

const CATEGORY_COPY = {
  '': {
    title: 'All fragrances',
    seo: 'Shop Original Perfumes & Attars Online in India',
    intro: 'Designer houses, niche perfumers and Indian attars under one roof. Every bottle is an original and ships with a GST invoice; most can be tried first as a 10 ml decant.',
  },
  designer: {
    title: 'Designer',
    seo: 'Original Designer Perfumes Online in India',
    intro: 'The fashion houses and their icons: Dior, Chanel, Yves Saint Laurent, Versace and more. Originals with a GST invoice, most available as a 10 ml decant.',
  },
  niche: {
    title: 'Niche',
    seo: 'Original Niche Perfumes Online in India',
    intro: 'Perfumers who work outside the big fashion groups, from Creed and Tom Ford to Maison Margiela. Originals with a GST invoice, most available as a 10 ml decant.',
  },
  Men: {
    title: 'Men',
    seo: "Original Men's Perfumes Online in India",
    intro: 'Fragrances made for men: fresh fougères, aromatic woods, leather and spice, from the houses that defined them. Originals with a GST invoice, delivered across India.',
  },
  Women: {
    title: 'Women',
    seo: "Original Women's Perfumes Online in India",
    intro: 'Florals, ambers and gourmands made for women, from the icons to newer names. Originals with a GST invoice, delivered across India.',
  },
  Unisex: {
    title: 'Unisex',
    seo: 'Original Unisex Perfumes Online in India',
    intro: 'Fragrances meant to be worn by anyone: oud, woods, tobacco, musk and citrus. Originals with a GST invoice, delivered across India.',
  },
  Attar: {
    title: 'Attar',
    seo: 'Buy Pure Attar (Ittar) Online in India',
    intro: 'Attar, or ittar, is a concentrated perfume oil with no alcohol. A drop on the pulse points lasts for hours and sits close to the skin. Oud, rose and musk attars, delivered across India.',
  },
  'Gift Sets': {
    title: 'Gifts',
    seo: 'Perfume Gift Sets & Discovery Sets Online in India',
    intro: 'Discovery sets and boxed fragrances, ready to give for weddings, birthdays and festivals. Originals with a GST invoice, delivered across India.',
  },
};

const FILTER_KEYS = ['search', 'price_min', 'price_max', 'note', 'occasion', 'brand', 'availability', 'in_stock', 'sort'];

export async function generateMetadata({ searchParams }) {
  const category = searchParams?.category || '';
  const tier = searchParams?.tier || '';
  const copy = CATEGORY_COPY[tier] || CATEGORY_COPY[category] || CATEGORY_COPY[''];
  const canonical = tier ? `/products?tier=${tier}` : category ? `/products?category=${encodeURIComponent(category)}` : '/products';
  const filtered = FILTER_KEYS.some((k) => searchParams?.[k]) || (searchParams?.page && searchParams.page !== '1');
  return {
    title: copy.seo,
    description: copy.intro,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: `${copy.seo} | Spraykart`, description: copy.intro, url: canonical, type: 'website' },
  };
}

function pageHref(searchParams, page) {
  const params = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([k, v]) => { if (v && k !== 'page' && k !== 'focus') params.set(k, v); });
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ''}`;
}

export default async function ProductsPage({ searchParams = {} }) {
  const query = readListingParams(searchParams);
  const copy = CATEGORY_COPY[query.tier] || CATEGORY_COPY[query.category] || { title: query.category, intro: '' };

  let result = { products: [], total: 0, pages: 0 };
  let brands = [];
  let failed = false;
  try {
    [result, brands] = await Promise.all([listProducts(query), listBrands()]);
  } catch (err) {
    logger.error('Listing failed:', err);
    failed = true;
  }

  const { products, total, pages } = result;
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy.title,
    numberOfItems: total,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: (query.page - 1) * query.limit + i + 1,
      url: `${SITE_URL}/products/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <header className="h-wrap pl-head">
        <div>
          <h1 className="t-display t-xl">{query.search ? `“${query.search}”` : copy.title}</h1>
          {!query.search && copy.intro && <p className="t-body t-mute" style={{ maxWidth: '60ch', marginTop: 20 }}>{copy.intro}</p>}
        </div>
        <p className="t-label t-mute-3 tabular" aria-live="polite">{total} {total === 1 ? 'fragrance' : 'fragrances'}</p>
      </header>

      <ListingTools brands={brands} />

      <section className="h-wrap" style={{ paddingBlock: '48px 120px' }} aria-label="Products">
        {failed ? (
          <div style={{ paddingBlock: 80, display: 'grid', gap: 20, justifyItems: 'start' }}>
            <p className="t-display t-m">The collection didn&apos;t load.</p>
            <p className="t-body t-mute">Something went wrong on our side. Refresh the page, or come back in a minute.</p>
            <Link href={pageHref(searchParams, query.page)} className="h-btn h-btn--ghost">Try again</Link>
          </div>
        ) : products.length === 0 ? (
          <div style={{ paddingBlock: 80, display: 'grid', gap: 20, justifyItems: 'start' }}>
            <p className="t-display t-m">Nothing matches that yet.</p>
            <p className="t-body t-mute" style={{ maxWidth: '50ch' }}>Try fewer filters, a different note, or ask an advisor on WhatsApp. We can often source a bottle we don&apos;t list.</p>
            <Link href={query.category ? `/products?category=${encodeURIComponent(query.category)}` : '/products'} className="h-btn h-btn--ghost">Clear filters</Link>
          </div>
        ) : (
          <>
            <div className="h-grid">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
            {pages > 1 && (
              <nav className="pl-pager" aria-label="Pages">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={pageHref(searchParams, n)} aria-current={n === query.page ? 'page' : undefined} className="tabular" style={{ minWidth: 44, height: 44, display: 'inline-grid', placeItems: 'center', ...(n === query.page ? { background: 'var(--ink)', color: 'var(--bone)' } : {}) }}>
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
