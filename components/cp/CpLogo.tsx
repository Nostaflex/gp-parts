type CpLogoTone = 'dark' | 'light';
type CpLogoSize = 'nav' | 'footer';

type CpLogoProps = {
  tone?: CpLogoTone;
  size?: CpLogoSize;
  className?: string;
};

const RED = '#D92627'; // cp.red — accent logo Car Performance

const SIZE_CLASS: Record<CpLogoSize, string> = {
  nav: 'h-12 sm:h-14',
  footer: 'h-16',
};

/**
 * Mark voiture — coupé de profil, roues à moyeu rouge, lignes de vitesse.
 * Carrosserie en currentColor; la lunette est découpée (evenodd) pour
 * laisser transparaître n'importe quel fond.
 */
function CarMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 80"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ height: '100%', width: 'auto' }}
    >
      <path d="M4 36 H26" stroke={RED} strokeWidth="5" strokeLinecap="round" />
      <path d="M10 48 H24" stroke={RED} strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M26 58 C23 52 24 46 30 43 C38 40 46 39 54 38 C61 28 72 23 85 23 C96 23 104 28 110 35 C119 37 128 40 133 44 C137 47 138 52 136 55 C135 57 133 58 130 58 L124 58 A 11 11 0 0 0 102 58 L64 58 A 11 11 0 0 0 42 58 L29 58 Z M86 28 C93 28 99 31 103 36 L86 36 Z"
      />
      <circle cx="53" cy="58" r="9" fill="currentColor" />
      <circle cx="53" cy="58" r="4" fill={RED} />
      <circle cx="113" cy="58" r="9" fill="currentColor" />
      <circle cx="113" cy="58" r="4" fill={RED} />
      <path d="M26 72 H134" stroke={RED} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function CpLogo({ tone = 'dark', size = 'nav', className = '' }: CpLogoProps) {
  const isDark = tone === 'dark';
  const markColor = isDark ? 'text-cp-cream' : 'text-cp-ink';
  const textColor = isDark ? 'text-cp-cream' : 'text-cp-ink';
  const subColor = isDark ? 'text-cp-cream/48' : 'text-cp-ink/55';

  return (
    <span
      aria-label="Car Performance"
      className={[
        'inline-flex items-center gap-2.5 shrink-0 leading-none',
        SIZE_CLASS[size],
        className,
      ].join(' ')}
    >
      <span className={`block h-full py-0.5 ${markColor}`}>
        <CarMark />
      </span>

      <span className="flex flex-col justify-center">
        <span
          className={[
            'cp-title font-black uppercase tracking-normal whitespace-nowrap',
            textColor,
            size === 'nav' ? 'text-[1.35rem] sm:text-[1.6rem]' : 'text-[1.85rem]',
          ].join(' ')}
        >
          Car <span className="text-cp-red">Performance</span>
        </span>
        <span
          className={[
            'cp-mono uppercase tracking-[0.16em]',
            subColor,
            size === 'nav' ? 'text-[0.48rem] sm:text-[0.56rem]' : 'text-[0.62rem]',
          ].join(' ')}
        >
          Guadeloupe · Auto & Moto
        </span>
      </span>
    </span>
  );
}
