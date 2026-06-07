'use client';

import { useState } from 'react';
import Image from 'next/image';

type Props = {
  images: string[];
  alt: string;
};

export function MotoGallery({ images, alt }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = images[activeIdx] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F8F5F0] border border-[#E5DDD3]">
        <Image
          key={active}
          src={active}
          alt={`${alt} — vue ${activeIdx + 1}`}
          fill
          priority={activeIdx === 0}
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover"
        />
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-cp-ink/80 text-cp-cream cp-mono text-[0.65rem] px-2 py-1 rounded-full">
            {activeIdx + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={`Voir image ${idx + 1}`}
              aria-current={activeIdx === idx ? 'true' : undefined}
              className={`relative aspect-[4/3] rounded-lg overflow-hidden bg-[#F8F5F0] border-2 transition-all ${
                activeIdx === idx
                  ? 'border-cp-red'
                  : 'border-[#E5DDD3] hover:border-cp-ink/30 opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
