import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export type UniversEntry = {
  href: string;
  label: string;
  tag: string;
  desc: string;
  accent: string;
  img: string;
  /** Voile custom (maquette cp-v4 : lagon pour Lavage, vert pour Location). Défaut : voile ink. */
  veil?: string;
  /** Mascotte détourée en surimpression droite (Splash, Max) — handoff 2026-08-17. */
  mascotte?: { src: string; alt: string };
};

const VOILE_INK =
  'linear-gradient(to top, rgba(26,15,6,0.92) 0%, rgba(26,15,6,0.45) 55%, rgba(26,15,6,0.18) 100%)';

/**
 * Carte de la grille « Nos univers » (accueil). Extraite de app/page.tsx au
 * lot 2 du handoff design 2026-08-17 pour porter mascottes + voiles colorés.
 */
export function CpUniversCard({ univers: u }: { univers: UniversEntry }) {
  return (
    <Link
      href={u.href}
      className="group flex flex-col relative rounded-2xl overflow-hidden p-8 min-h-[260px] md:min-h-[300px]"
    >
      {/* Photo univers + voile — zoom lent au survol */}
      <Image
        src={u.img}
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-cp-out group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: u.veil ?? VOILE_INK }}
      />

      {u.mascotte && (
        <Image
          src={u.mascotte.src}
          alt={u.mascotte.alt}
          width={180}
          height={270}
          className="absolute -right-[10px] -bottom-[14px] z-[1] h-[240px] md:h-[270px] w-auto drop-shadow-[0_14px_22px_rgba(0,0,0,.4)]"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
          }}
        />
      )}

      <div className="relative z-[2] flex items-start justify-between">
        <span className="cp-mono text-xs tracking-widest" style={{ color: u.accent }}>
          {u.tag}
        </span>
        <svg
          className="transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ color: u.accent }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      {/* Titres alignés entre cartes d'une même rangée : place réservée à la
          mascotte via padding-right (jamais en bridant la largeur du texte),
          description bornée à 2 lignes. */}
      <div className={cn('relative z-[2] mt-auto pt-16', u.mascotte && 'pr-[112px] md:pr-[150px]')}>
        <h3 className="cp-title text-cp-cream font-black text-4xl leading-none mb-3">
          {u.label.toUpperCase()}
        </h3>
        <p className="text-cp-cream/75 text-sm leading-relaxed max-w-md line-clamp-2">{u.desc}</p>
      </div>

      <div
        className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"
        style={{ backgroundColor: u.accent }}
      />
    </Link>
  );
}
