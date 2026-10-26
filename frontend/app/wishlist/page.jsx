'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/lib/store';
import ProductCard from '@/components/product/ProductCard';

// Saved items come from cards (with `image`) and product pages (with `images`); normalise for the card.
const withImage = (p) => ({
  ...p,
  image: p.image || p.images?.find((i) => i.is_primary)?.url || p.images?.[0]?.url,
  second_image: p.second_image || p.images?.find((i) => !i.is_primary)?.url,
});

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-wrap" style={{ minHeight: '60vh' }} />;

  return (
    <>
      <header className="h-wrap pg-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <h1 className="t-display t-xl">Saved</h1>
        {items.length > 0 && <span className="t-label t-mute-3 tabular">{items.length} {items.length === 1 ? 'bottle' : 'bottles'}</span>}
      </header>
      {items.length === 0 ? (
        <div className="h-wrap h-section" style={{ display: 'grid', gap: 24, justifyItems: 'start' }}>
          <p className="t-display t-m">Nothing saved yet.</p>
          <p className="t-body t-mute" style={{ maxWidth: '48ch' }}>Tap the heart on any bottle to keep it here while you decide. Saved bottles stay on this device.</p>
          <Link href="/products" className="h-link">Browse fragrances <ArrowRight size={14} strokeWidth={1.25} /></Link>
        </div>
      ) : (
        <section className="h-wrap" style={{ paddingBlock: '48px 120px' }}>
          <div className="h-grid">
            {items.map((p) => <ProductCard key={p.id} product={withImage(p)} />)}
          </div>
        </section>
      )}
    </>
  );
}
