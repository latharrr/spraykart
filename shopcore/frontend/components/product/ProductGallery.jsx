'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function ProductGallery({ images = [] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const activeImage = images[active];

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main image */}
        <div
          className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-zoom-in group"
          onClick={() => activeImage && setLightbox(true)}
        >
          {activeImage ? (
            <>
              <Image
                src={activeImage.url}
                alt="Product image"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition drop-shadow" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                  i === active ? 'border-black' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <Image src={img.url} alt={`View ${i + 1}`} fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Modal isOpen={lightbox} onClose={() => setLightbox(false)} size="xl" title="">
        {activeImage && (
          <div className="relative aspect-square w-full">
            <Image src={activeImage.url} alt="Product zoom" fill className="object-contain" />
          </div>
        )}
      </Modal>
    </>
  );
}
