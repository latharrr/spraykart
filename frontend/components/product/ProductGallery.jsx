'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { sizedImage } from '@/lib/shop';

export default function ProductGallery({ images = [], name = 'Product' }) {
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    if (zoom === null) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setZoom(null);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [zoom]);

  if (!images.length) {
    return <div className="pd__gallery"><div className="pd__shot" style={{ display: 'grid', placeItems: 'center', cursor: 'default' }}><span className="t-label t-mute-3">Image soon</span></div></div>;
  }

  return (
    <>
      <div className="pd__gallery" aria-label={`${name} images`}>
        {images.map((img, i) => (
          <button key={img.id || img.url} type="button" className="pd__shot" onClick={() => setZoom(i)} aria-label={`Enlarge image ${i + 1} of ${name}`}>
            <Image src={sizedImage(img.url, 1400)} alt={i === 0 ? name : ''} fill priority={i === 0} sizes="(max-width: 1023px) 86vw, 54vw" />
          </button>
        ))}
      </div>

      {zoom !== null && (
        <div role="dialog" aria-modal="true" aria-label={`${name}, enlarged`} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--bone)', display: 'grid' }}>
          <button className="h-close" onClick={() => setZoom(null)} aria-label="Close" style={{ position: 'absolute', top: 16, right: 28, zIndex: 2 }}><X size={22} strokeWidth={1.25} /></button>
          <div style={{ position: 'relative', margin: '64px var(--gutter)' }}>
            <Image src={sizedImage(images[zoom].url, 2000)} alt={name} fill sizes="100vw" style={{ objectFit: 'contain' }} />
          </div>
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20 }}>
              {images.map((img, i) => (
                <button key={img.url} type="button" className="t-label tabular" onClick={() => setZoom(i)} aria-current={i === zoom} style={{ background: 'none', border: 0, cursor: 'pointer', opacity: i === zoom ? 1 : 0.5, minHeight: 44 }}>
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
