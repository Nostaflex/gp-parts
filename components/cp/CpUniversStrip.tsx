import Link from 'next/link';
import { CpReveal } from '@/components/cp/CpReveal';

type UniversId = 'reparation' | 'location' | 'vente-vehicule' | 'vente-moto' | 'pieces';

const UNIVERS: { id: UniversId; href: string; label: string; accent: string }[] = [
  { id: 'reparation', href: '/reparation', label: 'Réparation', accent: '#E87200' },
  { id: 'location', href: '/location', label: 'Location', accent: '#52C88A' },
  { id: 'vente-vehicule', href: '/vente-vehicule', label: 'Vente véhicule', accent: '#2A5C45' },
  { id: 'vente-moto', href: '/vente-moto', label: 'Vente moto', accent: '#C8392E' },
  { id: 'pieces', href: '/pieces', label: 'Pièces détachées', accent: '#E9C46A' },
];

type CpUniversStripProps = {
  /** Univers de la page courante — exclu de la liste. */
  current: UniversId;
  /** 'light' = fond cream (défaut), 'dark' = fond sombre. */
  tone?: 'light' | 'dark';
};

/**
 * Bandeau de maillage interne « Explorez nos autres univers » — affiché
 * au-dessus du footer des pages univers pour croiser les parcours.
 */
export function CpUniversStrip({ current, tone = 'light' }: CpUniversStripProps) {
  const others = UNIVERS.filter((u) => u.id !== current);
  const isDark = tone === 'dark';

  return (
    <section
      aria-label="Nos autres univers"
      className="py-16 px-6"
      style={{ backgroundColor: isDark ? '#1A0F06' : '#F4EDE0' }}
    >
      <div className="max-w-7xl mx-auto">
        <CpReveal>
          <p
            className={`cp-mono text-xs tracking-widest uppercase mb-8 ${
              isDark ? 'text-cp-cream/40' : 'text-cp-ink/40'
            }`}
          >
            Explorez nos autres univers
          </p>
          <div className="flex flex-wrap gap-3">
            {others.map((u) => (
              <Link
                key={u.id}
                href={u.href}
                className={`group inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98] ${
                  isDark
                    ? 'border-white/15 text-cp-cream/80 hover:text-cp-cream hover:bg-white/5'
                    : 'border-cp-ink/15 text-cp-ink/80 hover:text-cp-ink hover:bg-white/60'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: u.accent }}
                />
                {u.label}
                <svg
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </CpReveal>
      </div>
    </section>
  );
}
