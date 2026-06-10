import Image from 'next/image';

type CpLogoTone = 'dark' | 'light';
type CpLogoSize = 'nav' | 'footer';

type CpLogoProps = {
  tone?: CpLogoTone;
  size?: CpLogoSize;
  className?: string;
};

const NAV_SIZE = 'h-8 min-[380px]:h-10 sm:h-14';

/**
 * Lockup horizontal: emblème original (anneau rouge + voiture noire de face,
 * extrait de logo-carperformance.svg sans le bandeau texte illisible en nav)
 * + wordmark recomposé lisible. Couleurs du wordmark fidèles au bandeau
 * d'origine: CAR rouge, PERFORMANCE ink/cream selon le fond.
 */
export function CpLogo({ tone = 'dark', size = 'nav', className = '' }: CpLogoProps) {
  const isDark = tone === 'dark';
  const textColor = isDark ? 'text-cp-cream' : 'text-cp-ink';
  const subColor = isDark ? 'text-cp-cream/48' : 'text-cp-ink/55';

  return (
    <span
      aria-label="Car Performance"
      className={[
        size === 'nav'
          ? 'inline-flex items-center gap-2 sm:gap-2.5'
          : 'inline-flex flex-col items-start gap-3',
        'shrink-0 leading-none',
        size === 'nav' ? NAV_SIZE : '',
        className,
      ].join(' ')}
    >
      <Image
        src="/images/logo-cp-emblem.svg"
        alt=""
        width={875}
        height={625}
        priority={size === 'nav'}
        className={size === 'nav' ? 'h-full w-auto' : 'h-20 w-auto'}
      />

      <span className="flex flex-col justify-center">
        <span
          className={[
            'cp-title font-black uppercase tracking-normal whitespace-nowrap',
            textColor,
            size === 'nav'
              ? 'text-[0.8rem] min-[380px]:text-[1.05rem] sm:text-[1.6rem]'
              : 'text-[1.55rem]',
          ].join(' ')}
        >
          <span className="text-cp-red">Car</span> Performance
        </span>
        <span
          className={[
            'cp-mono uppercase tracking-[0.16em]',
            subColor,
            size === 'nav'
              ? 'text-[0.34rem] min-[380px]:text-[0.4rem] sm:text-[0.56rem]'
              : 'text-[0.55rem]',
          ].join(' ')}
        >
          Guadeloupe · Auto & Moto
        </span>
      </span>
    </span>
  );
}
