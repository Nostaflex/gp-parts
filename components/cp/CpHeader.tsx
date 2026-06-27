'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isPathVisible } from '@/lib/feature-flags';
import { useCart } from '@/components/cart/CartProvider';
import { useFeatureFlags } from '@/components/cp/FeatureFlagsProvider';
import { CpLogo } from '@/components/cp/CpLogo';

const NAV_LINKS = [
  { href: '/reparation', label: 'Réparation' },
  { href: '/location', label: 'Location' },
  { href: '/vente-vehicule', label: 'Vente véhicule' },
  { href: '/vente-moto', label: 'Vente moto' },
  { href: '/pieces', label: 'Pièces' },
  { href: '/contact', label: 'Contact' },
];

type HeaderTheme = 'dark' | 'light';

type CpHeaderProps = {
  darkSectionIds?: string[];
};

export function CpHeader({ darkSectionIds = [] }: CpHeaderProps) {
  const [theme, setTheme] = useState<HeaderTheme>('dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { totalItems, isReady } = useCart();
  const pathname = usePathname();
  const flags = useFeatureFlags();
  const navLinks = NAV_LINKS.filter((l) => isPathVisible(l.href, flags));

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (darkSectionIds.length === 0) return;

    const onScroll = () => {
      const sy = window.scrollY + 80;
      let inDark = true; // hero is dark by default

      for (const id of darkSectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop;
        const bot = top + el.offsetHeight;
        if (sy >= top && sy < bot) {
          // if the section class contains 'light' we flip
          inDark = !el.dataset.cpLight;
          break;
        }
      }

      setTheme(inDark ? 'dark' : 'light');
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [darkSectionIds]);

  return (
    <header
      ref={headerRef}
      style={{ zIndex: 'var(--z-header)' as string }}
      className={[
        'fixed top-0 left-0 right-0 transition-colors duration-300',
        theme === 'dark'
          ? 'bg-u-cinema/90 backdrop-blur-md text-cp-cream border-white/10'
          : 'bg-u-craft/95 backdrop-blur-md text-cp-ink border-cp-ink/10',
        'border-b',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Car Performance — accueil"
          className="flex items-center hover:opacity-85 transition-opacity"
        >
          <CpLogo tone={theme} size="nav" />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden lg:flex items-center gap-6 text-sm font-medium"
          aria-label="Navigation principale"
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`relative hover:text-cp-mango transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-cp-mango after:rounded-full after:transition-all after:duration-300 ${
                isActive(l.href) ? 'text-cp-mango after:w-full' : 'after:w-0'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Groupe droite : panier + CTA + burger */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Panier — toujours visible (accès direct au tunnel d'achat) */}
          <Link
            href="/panier"
            aria-label={`Panier${isReady && totalItems > 0 ? ` (${totalItems} article${totalItems > 1 ? 's' : ''})` : ''}`}
            className="relative p-2 hover:text-cp-mango transition-colors"
          >
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {isReady && totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-cp-red text-cp-cream text-[0.65rem] font-bold flex items-center justify-center">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* CTA desktop */}
          <Link
            href="/contact"
            className="hidden lg:inline-flex items-center gap-2 bg-cp-red text-cp-cream text-sm font-semibold px-4 py-2 rounded-full hover:bg-cp-red-d active:scale-[0.98] transition-[background-color,transform]"
          >
            Prendre RDV
          </Link>

          {/* Burger mobile */}
          <button
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
          >
            <span
              className={`block w-6 h-0.5 transition-all ${theme === 'dark' ? 'bg-cp-cream' : 'bg-cp-ink'} ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
            />
            <span
              className={`block w-6 h-0.5 transition-all ${theme === 'dark' ? 'bg-cp-cream' : 'bg-cp-ink'} ${menuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block w-6 h-0.5 transition-all ${theme === 'dark' ? 'bg-cp-cream' : 'bg-cp-ink'} ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className={`lg:hidden border-t px-6 py-4 flex flex-col gap-4 animate-slide-up ${theme === 'dark' ? 'bg-u-cinema border-white/10' : 'bg-u-craft border-cp-ink/10'}`}
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`text-sm font-medium hover:text-cp-mango transition-colors ${
                isActive(l.href) ? 'text-cp-mango' : ''
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="inline-flex justify-center bg-cp-red text-cp-cream text-sm font-semibold px-4 py-2 rounded-full"
          >
            Prendre RDV
          </Link>
        </div>
      )}
    </header>
  );
}
