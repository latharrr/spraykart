'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, useBagUI } from '@/lib/store';
import { inr, sizedImage, nameWithoutHouse } from '@/lib/shop';

const CONCENTRATIONS = [
  [/\bextrait\b|\bparfum\b(?!s)/i, 'Parfum'],
  [/\bedp\b|eau de parfum/i, 'Eau de parfum'],
  [/\bedt\b|eau de toilette/i, 'Eau de toilette'],
  [/\battar\b|\bittar\b/i, 'Attar'],
];

function concentrationOf(look) {
  const text = `${look.name} ${look.category} ${String(look.description || '').slice(0, 200)}`;
  return CONCENTRATIONS.find(([re]) => re.test(text))?.[1] || null;
}

// Split a name into at most two balanced display lines.
function twoLines(name) {
  const words = name.split(' ');
  if (words.length < 2) return [name];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

export default function HomeHero({ look }) {
  const addItem = useCartStore((s) => s.addItem);
  const openBag = useBagUI((s) => s.openBag);

  const price = Number(look.price);
  const mrp = Number(look.compare_price) > price ? Number(look.compare_price) : null;
  const house = look.brand && !/^spraykart/i.test(look.brand) ? look.brand : null;
  // Drop a trailing concentration ("Sauvage EDP") from the display name; the spec line states it.
  const rest = nameWithoutHouse(look).replace(/\s+(EDP|EDT)$/i, '');
  const lines = house && !rest.toLowerCase().includes(house.toLowerCase()) ? [house, rest] : twoLines(rest);
  const spec = [house, concentrationOf(look), look.base_size].filter(Boolean);
  const soldOut = Number(look.stock) === 0;
  const note = String(look.description || '').replace(/<[^>]+>/g, '').split(/(?<=\.)\s/)[0];

  const add = () => {
    if (!addItem(look, null, 1)) {
      toast.error('This bottle is sold out right now');
      return;
    }
    openBag();
  };

  return (
    <section className="hp-hero" aria-labelledby="hp-look-name">
      <div className="hp-hero__copy">
        <h1 id="hp-look-name" className="t-display t-hero hp-hero__name">
          {lines.map((line) => (
            <span className="hp-reveal-line" key={line}><span>{line}</span>{' '}</span>
          ))}
        </h1>
        {note && <p className="hp-hero__note t-body t-mute hp-reveal-fade">{note}</p>}
        <div className="hp-hero__facts hp-reveal-fade">
          {spec.length > 0 && <span className="t-label-l">{spec.join(' · ')}</span>}
          <span className="h-price">{inr(price)}</span>
          {mrp && <span className="t-small t-mute h-price">MRP <s>{inr(mrp)}</s></span>}
        </div>
        <div className="hp-hero__actions">
          <button type="button" className="h-btn" onClick={add} disabled={soldOut}>{soldOut ? 'Sold out' : 'Add to bag'}</button>
          <Link href={`/products/${look.slug}`} className="h-link">View the bottle <ArrowRight size={14} strokeWidth={1.25} /></Link>
        </div>
      </div>
      <div className="hp-hero__media">
        {look.image && (
          <Image src={sizedImage(look.image, 1600)} alt={look.name} fill priority sizes="(max-width: 1023px) 100vw, 45vw" className="hp-reveal-img" />
        )}
        <Link href={`/products/${look.slug}`} className="hp-hero__caption">
          <span style={{ display: 'grid', gap: 4 }}>
            <span>{rest}</span>
            {look.scent_family && <span style={{ opacity: 0.8 }}>{look.scent_family}</span>}
          </span>
          <span className="hp-hero__caption-link">View details</span>
        </Link>
      </div>
    </section>
  );
}
