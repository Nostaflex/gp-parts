import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export type UniversEntry = {
  href: string;
  label: string;
  tag: string;
  desc: string;
  accent: string;
  /** Fond de carte = dégradé de l'univers (retour Djemil 2026-08-17 : pas de photo). */
  bg: string;
  /** Mascotte détourée en surimpression droite (Splash, Max) — handoff 2026-08-17. */
  mascotte?: { src: string; alt: string; width: number; height: number };
};

/**
 * Carte de la grille « Nos univers » (accueil). Extraite de app/page.tsx au
 * lot 2 du handoff design 2026-08-17. Chaque univers est un aplat coloré —
 * les photos de fond ont été retirées sur retour Djemil (2026-08-17).
 */
export function CpUniversCard({ univers: u }: { univers: UniversEntry }) {
  return (
    <Link
      href={u.href}
      className="group flex flex-col relative rounded-2xl overflow-hidden p-6 min-h-[200px] md:min-h-[230px]"
      style={{ background: u.bg }}
    >
      {u.mascotte && (
        <Image
          src={u.mascotte.src}
          alt={u.mascotte.alt}
          width={u.mascotte.width}
          height={u.mascotte.height}
          className="absolute -right-[10px] -bottom-[14px] z-[1] h-[170px] md:h-[195px] w-auto transition-transform duration-500 ease-cp-out group-hover:scale-[1.04]"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
          }}
        />
      )}

      <div className="relative z-[2] flex items-start justify-between">
        <span className="cp-mono text-xs tracking-widest text-cp-cream/80">{u.tag}</span>
        <svg
          className="text-cp-cream/80 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      {/* Titres alignés entre cartes d'une même rangée : place réservée à la
          mascotte via padding-right (jamais en bridant la largeur du texte),
          description bornée à 2 lignes. */}
      <div className={cn('relative z-[2] mt-auto pt-10', u.mascotte && 'pr-[92px] md:pr-[120px]')}>
        <h3 className="cp-title text-cp-cream font-black text-3xl leading-none mb-3">
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
