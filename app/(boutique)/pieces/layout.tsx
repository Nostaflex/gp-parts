import type { ReactNode } from 'react';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpReveal } from '@/components/cp/CpReveal';
import Link from 'next/link';

export default function PiecesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CpHeader darkSectionIds={['pieces-hero']} />

      {/* Hero */}
      <section
        id="pieces-hero"
        className="relative pt-28 pb-0 px-6 overflow-hidden"
        style={{ backgroundColor: '#0D0905' }}
      >
        {/* Orb décoratif */}
        <div
          aria-hidden="true"
          className="absolute rounded-full animate-cp-orb pointer-events-none"
          style={{
            width: '500px',
            height: '500px',
            top: '50%',
            left: '60%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(232,114,0,0.10) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end pb-16">
            <div>
              <CpReveal>
                <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-5">
                  Univers · Pièces détachées
                </p>
              </CpReveal>
              <CpReveal delay={1}>
                <h1
                  className="cp-title font-black text-cp-cream leading-none mb-6"
                  style={{ fontSize: 'clamp(3rem, 7vw, 7rem)' }}
                >
                  PIÈCES
                  <br />
                  <span className="text-cp-mango">AUTO & MOTO</span>
                </h1>
              </CpReveal>
              <CpReveal delay={2}>
                <p className="text-cp-cream/55 text-base leading-relaxed max-w-md mb-8">
                  500+ références en stock. Qualité origine, livrées partout en Guadeloupe sous 24h.
                </p>
              </CpReveal>
              <CpReveal delay={3}>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/pieces"
                    className="inline-flex items-center gap-2 bg-cp-mango text-cp-cream font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-cp-mango/90 transition-colors"
                  >
                    Voir le catalogue
                    <svg
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
                  <Link
                    href="/pieces?promo=1"
                    className="inline-flex items-center gap-2 border border-cp-cream/25 text-cp-cream font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-cp-cream/08 transition-colors"
                  >
                    Nos promotions
                  </Link>
                </div>
              </CpReveal>
            </div>

            {/* Stats */}
            <CpReveal delay={2}>
              <div className="flex gap-10 pb-4 md:justify-end">
                {[
                  { val: '500+', lbl: 'Références' },
                  { val: '24h', lbl: 'Livraison' },
                  { val: '971', lbl: 'Guadeloupe 🏝' },
                ].map((s) => (
                  <div key={s.lbl}>
                    <p
                      className="cp-title font-black text-cp-mango leading-none"
                      style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
                    >
                      {s.val}
                    </p>
                    <p className="text-cp-cream/35 text-xs uppercase tracking-wider mt-1">
                      {s.lbl}
                    </p>
                  </div>
                ))}
              </div>
            </CpReveal>
          </div>
        </div>
      </section>

      {/* Bridge cinema → craft */}
      <CpBridge fromColor="#0D0905" toColor="#F8F5F0" />

      {/* Contenu catalogue — pt-24 compense le margin négatif du bridge (90px) */}
      <div style={{ backgroundColor: '#F8F5F0', minHeight: '60vh' }} className="pt-24">
        {children}
      </div>

      {/* Bridge craft → cinema */}
      <CpBridge fromColor="#F8F5F0" toColor="#0D0905" />

      {/* Footer CP */}
      <footer className="py-16 px-6" style={{ backgroundColor: '#1A0F06' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <p className="cp-title text-cp-cream font-black text-2xl mb-3">
                CAR<span className="text-cp-mango">PERF.</span>
              </p>
              <p className="text-cp-cream/40 text-sm leading-relaxed">
                Votre garage de confiance en Guadeloupe depuis 2010.
              </p>
            </div>
            <div>
              <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">Services</p>
              <div className="flex flex-col gap-2">
                {['/reparation', '/expertise', '/location', '/vente-vo'].map((href) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors capitalize"
                  >
                    {href.replace('/', '').replace('-', ' ')}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">
                Boutique pièces
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/pieces', label: 'Catalogue' },
                  { href: '/pieces?type=auto', label: 'Auto' },
                  { href: '/pieces?type=moto', label: 'Moto' },
                  { href: '/pieces?promo=1', label: 'Promotions' },
                  { href: '/panier', label: 'Mon panier' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">
                Informations
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/a-propos', label: 'À propos' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/mentions-legales', label: 'Mentions légales' },
                  { href: '/cgv', label: 'CGV' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-cp-cream/30 text-xs">
              © {new Date().getFullYear()} Car Performance Guadeloupe. Tous droits réservés.
            </p>
            <p className="cp-mono text-cp-cream/20 text-xs">971 🏝</p>
          </div>
        </div>
      </footer>
    </>
  );
}
