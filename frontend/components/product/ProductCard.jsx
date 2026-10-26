'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { memo } from 'react';
import toast from 'react-hot-toast';
import { useWishlistStore, useIsWishlisted } from '@/lib/store';
import { inr, sizedImage, nameWithoutHouse } from '@/lib/shop';

function ProductCard({ product, priority = false, sizes = '(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw' }) {
  const toggle = useWishlistStore((s) => s.toggle);
  const saved = useIsWishlisted(product.id);
  const price = Number(product.price);
  const mrp = Number(product.compare_price) > price ? Number(product.compare_price) : null;
  const soldOut = Number(product.stock) === 0;
  const house = product.brand || product.category;

  const onSave = (e) => {
    e.preventDefault();
    const added = toggle(product);
    toast(added ? 'Saved' : 'Removed from saved');
  };

  return (
    <Link href={`/products/${product.slug}`} className="h-card">
      <div className="h-card__media">
        {product.image ? (
          <>
            <Image
              src={sizedImage(product.image, 700)}
              alt={product.name}
              fill
              sizes={sizes}
              style={{ objectFit: 'cover' }}
              priority={priority}
            />
            {product.second_image && (
              <Image src={sizedImage(product.second_image, 700)} alt="" fill sizes={sizes} style={{ objectFit: 'cover' }} className="h-card__alt" />
            )}
          </>
        ) : (
          <span className="t-label t-mute-3" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>Image soon</span>
        )}
        {soldOut && <span className="h-card__state">Sold out</span>}
        <button type="button" className={`h-card__save${saved ? ' is-on' : ''}`} onClick={onSave} aria-pressed={saved} aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}>
          <Heart size={16} strokeWidth={1.25} />
        </button>
      </div>
      <div className="h-card__meta">
        {house && <span className="h-card__house">{house}</span>}
        <span className="h-card__name">{nameWithoutHouse(product)}</span>
        <span className="h-card__price h-price">{inr(price)}</span>
        {mrp && <span className="h-card__mrp h-price">MRP <s>{inr(mrp)}</s></span>}
      </div>
    </Link>
  );
}

export default memo(ProductCard);
