'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, useBagUI } from '@/lib/store';
import { inr, sizedImage, nameWithoutHouse } from '@/lib/shop';

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

export default function HomeHero({ looks }) {
  const [index, setIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const openBag = useBagUI((s) => s.openBag);
  const look = looks[index];
  if (!look) return null;

  const price = Number(look.price);
  const mrp = Number(look.compare_price) > price ? Number(look.compare_price) : null;
  const house = look.brand && look.brand !== 'Spraykart' ? look.brand : null;
  const rest = nameWithoutHouse(look);
  // House on the first line when it is printed on the bottle; otherwise balance the name over two lines.
  const lines = house && !rest.toLowerCase().includes(house.toLowerCase()) ? [house, rest] : twoLines(rest);
  const blurb = String(look.description || '').replace(/<[^>]+>/g, '').split(/(?<=\.)\s/)[0];

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
        {looks.length > 1 && (
          <div className="hp-hero__index" role="tablist" aria-label="Featured bottles">
            {looks.map((l, i) => (
              <button key={l.id} role="tab" aria-selected={i === index} aria-current={i === index} aria-label={l.name} onClick={() => setIndex(i)} />
            ))}
          </div>
        )}
        <h1 id="hp-look-name" className="t-display t-hero hp-hero__name" key={`n-${look.id}`}>
          {lines.map((line) => (
            <span className="hp-reveal-line" key={line}><span>{line}</span></span>
          ))}
        </h1>
        {blurb && <p className="t-body t-mute hp-reveal-fade" key={`b-${look.id}`} style={{ maxWidth: '44ch' }}>{blurb}</p>}
        <div className="hp-hero__facts hp-reveal-fade" key={`f-${look.id}`}>
          {look.scent_family && <span className="t-mute">{look.scent_family}</span>}
          <span className="h-price">{inr(price)}</span>
          {mrp && <span className="t-mute h-price">MRP <s>{inr(mrp)}</s></span>}
        </div>
        <div className="hp-hero__actions">
          <button type="button" className="h-btn" onClick={add} disabled={Number(look.stock) === 0}>
            {Number(look.stock) === 0 ? 'Sold out' : 'Add to bag'}
          </button>
          <Link href={`/products/${look.slug}`} className="h-link">View the bottle <ArrowRight size={14} strokeWidth={1.25} /></Link>
        </div>
      </div>
      <div className="hp-hero__media">
        {look.image && (
          <Image
            key={look.id}
            src={sizedImage(look.image, 1600)}
            alt={look.name}
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 45vw"
            className="hp-reveal-img"
          />
        )}
        <div className="hp-hero__caption">
          <span>{look.category}</span>
          <span>{index + 1} / {looks.length}</span>
        </div>
      </div>
    </section>
  );
}
