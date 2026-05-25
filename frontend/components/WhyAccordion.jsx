'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const promiseItems = [
  {
    number: '01',
    title: 'Official Invoices',
    body: 'Every product we stock comes with an official brand invoice. Not a screenshot. The real thing.',
  },
  {
    number: '02',
    title: 'Batch Code Verification',
    body: "Each bottle has a scannable batch code. You can verify it yourself on the brand's official website.",
  },
  {
    number: '03',
    title: 'Exported, Not Grey Market',
    body: 'Sourced from authorised international exporters — not street markets or middlemen.',
  },
  {
    number: '04',
    title: '7-Day Free Returns',
    body: 'If something feels off, return it within 7 days. No questions asked.',
  },
];

const brands = [
  'Dior',
  'Chanel',
  'YSL',
  'Versace',
  'Hugo Boss',
  'Paco Rabanne',
  'Maison Margiela',
  'Creed',
  'Byredo',
  'Davidoff',
  'Armani',
  'Rasasi',
];

const categories = [
  { label: 'For Him', value: 'Men' },
  { label: 'For Her', value: 'Women' },
  { label: 'Unisex', value: 'Unisex' },
];

export default function WhyAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="why-accordion">
      {promiseItems.map(({ number, title, body }, index) => {
        const open = openIndex === index;

        return (
          <div key={title} className="why-accordion-card">
            <button
              type="button"
              className="why-accordion-trigger"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? -1 : index)}
            >
              <span>
                <small>{number}</small>
                {title}
              </span>
              <span aria-hidden="true" className="why-accordion-toggle">{open ? '−' : '+'}</span>
            </button>
            <div className={`why-accordion-body${open ? ' is-open' : ''}`}>
              <p>{body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BrandScroll() {
  const router = useRouter();

  return (
    <div className="brand-scroll-shell">
      <div className="brand-scroll-row" aria-label="Perfume brands">
        {brands.map((brand) => (
          <button
            key={brand}
            type="button"
            className="brand-pill"
            onClick={() => router.push(`/products?search=${encodeURIComponent(brand)}`)}
          >
            {brand}
          </button>
        ))}
      </div>
      <div className="brand-categories" aria-label="Shop by category">
        {categories.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            className="category-pill"
            onClick={() => router.push(`/products?category=${encodeURIComponent(value)}`)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
