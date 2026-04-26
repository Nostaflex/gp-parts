'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/reparation', label: 'Réparation' },
  { href: '/expertise', label: 'Expertise' },
  { href: '/location', label: 'Location' },
  { href: '/vente-vo', label: 'Vente VO' },
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
          className="cp-title font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          CAR<span className="text-cp-mango">PERFORMANCE</span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium"
          aria-label="Navigation principale"
        >
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-cp-mango transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA desktop */}
        <Link
          href="/contact"
          className="hidden md:inline-flex items-center gap-2 bg-cp-mango text-cp-cream text-sm font-semibold px-4 py-2 rounded-full hover:bg-cp-mango/90 transition-colors"
        >
          Prendre RDV
        </Link>

        {/* Burger mobile */}
        <button
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex flex-col gap-1.5 p-2"
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

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className={`md:hidden border-t px-6 py-4 flex flex-col gap-4 ${theme === 'dark' ? 'bg-u-cinema border-white/10' : 'bg-u-craft border-cp-ink/10'}`}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium hover:text-cp-mango transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="inline-flex justify-center bg-cp-mango text-cp-cream text-sm font-semibold px-4 py-2 rounded-full"
          >
            Prendre RDV
          </Link>
        </div>
      )}
    </header>
  );
}
