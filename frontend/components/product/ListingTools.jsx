'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

const CATEGORIES = ['Men', 'Women', 'Unisex', 'Attar', 'Gift Sets'];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'bestselling', label: 'Best selling' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
];
const PRICES = [
  { label: 'Under ₹2,500', min: '', max: '2500' },
  { label: '₹2,500 – ₹5,000', min: '2500', max: '5000' },
  { label: '₹5,000 – ₹10,000', min: '5000', max: '10000' },
  { label: 'Over ₹10,000', min: '10000', max: '' },
];
const NOTES = ['Oud', 'Rose', 'Musk', 'Amber', 'Vanilla', 'Citrus', 'Bergamot', 'Jasmine', 'Iris', 'Vetiver', 'Sandalwood', 'Leather', 'Tobacco', 'Pepper'];
const OCCASIONS = ['Daily wear', 'Office', 'Evening', 'Date night', 'Wedding', 'Gifting', 'Travel'];

const split = (v) => (v ? v.split(',').filter(Boolean) : []);

export default function ListingTools({ brands = [] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const searchRef = useRef(null);
  const timer = useRef(null);

  const category = sp.get('category') || '';
  const tier = sp.get('tier') || '';
  const sort = sp.get('sort') || 'newest';
  const priceMin = sp.get('price_min') || '';
  const priceMax = sp.get('price_max') || '';
  const notes = split(sp.get('note'));
  const occasions = split(sp.get('occasion'));
  const pickedBrands = split(sp.get('brand'));
  const inStock = sp.get('availability') === 'in_stock';

  useEffect(() => {
    if (sp.get('focus') === 'search') searchRef.current?.focus();
  }, [sp]);

  const push = (updates) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    params.delete('page');
    params.delete('focus');
    const qs = params.toString();
    startTransition(() => router.push(`/products${qs ? `?${qs}` : ''}`, { scroll: false }));
  };

  const toggleIn = (key, values, value) => {
    const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
    push({ [key]: next.join(',') });
  };

  const applied = [
    ...(tier ? [{ label: tier === 'niche' ? 'Niche' : 'Designer', clear: { tier: '' } }] : []),
    ...(category ? [{ label: category, clear: { category: '' } }] : []),
    ...(priceMin || priceMax ? [{ label: PRICES.find((p) => p.min === priceMin && p.max === priceMax)?.label || 'Price', clear: { price_min: '', price_max: '' } }] : []),
    ...pickedBrands.map((b) => ({ label: b, clear: { brand: pickedBrands.filter((x) => x !== b).join(',') } })),
    ...notes.map((n) => ({ label: n, clear: { note: notes.filter((x) => x !== n).join(',') } })),
    ...occasions.map((o) => ({ label: o, clear: { occasion: occasions.filter((x) => x !== o).join(',') } })),
    ...(inStock ? [{ label: 'In stock', clear: { availability: '' } }] : []),
  ];
  const filterCount = applied.length - (category ? 1 : 0) - (tier ? 1 : 0);

  return (
    <div className="pl-tools" aria-busy={pending}>
      <div className="h-wrap">
        <div className="pl-tools__in">
          <label className="pl-search">
            <Search size={15} strokeWidth={1.25} aria-hidden="true" />
            <span className="sr-only">Search fragrances</span>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search a house, a bottle or a note"
              defaultValue={sp.get('search') || ''}
              onChange={(e) => {
                clearTimeout(timer.current);
                const v = e.target.value;
                timer.current = setTimeout(() => push({ search: v }), 350);
              }}
            />
          </label>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
            <button type="button" className="h-link" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="pl-filter">
              {open ? 'Close filters' : `Filter${filterCount ? ` (${filterCount})` : ''}`}
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sr-only">Sort by</span>
              <select className="pl-sort" value={sort} onChange={(e) => push({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {open && (
          <div id="pl-filter" className="pl-filter h-rule">
            <fieldset>
              <h4>Department</h4>
              <div className="pl-chips">
                {[['designer', 'Designer'], ['niche', 'Niche']].map(([t, l]) => (
                  <button key={t} type="button" className="h-chip" aria-pressed={tier === t} onClick={() => push({ tier: tier === t ? '' : t })}>{l}</button>
                ))}
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" className="h-chip" aria-pressed={category === c} onClick={() => push({ category: category === c ? '' : c })}>{c}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <h4>Price</h4>
              <div style={{ display: 'grid' }}>
                {PRICES.map((p) => {
                  const on = priceMin === p.min && priceMax === p.max;
                  return (
                    <label key={p.label} className="h-check">
                      <input type="checkbox" checked={on} onChange={() => push(on ? { price_min: '', price_max: '' } : { price_min: p.min, price_max: p.max })} />
                      {p.label}
                    </label>
                  );
                })}
                <label className="h-check">
                  <input type="checkbox" checked={inStock} onChange={() => push({ availability: inStock ? '' : 'in_stock' })} />
                  In stock only
                </label>
              </div>
            </fieldset>
            {brands.length > 0 && (
              <fieldset>
                <h4>House</h4>
                <div style={{ display: 'grid', maxHeight: 260, overflowY: 'auto' }}>
                  {brands.map(({ brand, n }) => (
                    <label key={brand} className="h-check">
                      <input type="checkbox" checked={pickedBrands.includes(brand)} onChange={() => toggleIn('brand', pickedBrands, brand)} />
                      <span style={{ flex: 1 }}>{brand}</span>
                      <span className="t-small t-mute-3 tabular">{n}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset>
              <h4>Notes</h4>
              <div className="pl-chips">
                {NOTES.map((n) => (
                  <button key={n} type="button" className="h-chip" aria-pressed={notes.includes(n)} onClick={() => toggleIn('note', notes, n)}>{n}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <h4>Occasion</h4>
              <div className="pl-chips">
                {OCCASIONS.map((o) => (
                  <button key={o} type="button" className="h-chip" aria-pressed={occasions.includes(o)} onClick={() => toggleIn('occasion', occasions, o)}>{o}</button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {applied.length > 0 && (
          <div className="pl-applied" style={{ paddingBottom: 16 }}>
            {applied.map((a) => (
              <button key={a.label} type="button" className="h-chip is-on" onClick={() => push(a.clear)} aria-label={`Remove ${a.label}`}>
                {a.label} <X size={12} strokeWidth={1.5} />
              </button>
            ))}
            <button type="button" className="h-link" style={{ marginLeft: 8 }} onClick={() => startTransition(() => router.push('/products', { scroll: false }))}>Clear all</button>
          </div>
        )}
      </div>
    </div>
  );
}
