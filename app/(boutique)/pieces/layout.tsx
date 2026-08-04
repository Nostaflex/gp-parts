import type { ReactNode } from 'react';
import Link from 'next/link';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpLogo } from '@/components/cp/CpLogo';
import { CpUniversStrip } from '@/components/cp/CpUniversStrip';

/**
 * Chrome léger partagé /pieces/* : header, ponts bas, strip univers, footer.
 * Le hero catalogue vit dans pieces/page.tsx (PiecesHero) — la PDP ne doit
 * pas en hériter (audit #15). Chaque page porte son propre fond clair.
 */
export default function PiecesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CpHeader darkSectionIds={['pieces-hero']} />

      {children}

      {/* Bridge craft → cinema */}
      <CpBridge fromColor="#F8F5F0" toColor="#1A0F06" />

      <CpUniversStrip current="pieces" tone="dark" />

      {/* Footer CP */}
      <footer className="py-16 px-6" style={{ backgroundColor: '#1A0F06' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <CpLogo tone="dark" size="footer" className="mb-4" />
              <p className="text-cp-cream/40 text-sm leading-relaxed">
                Votre garage de confiance en Guadeloupe — passion, conseil technique, pièces de
                qualité.
              </p>
            </div>
            <div>
              <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">Services</p>
              <div className="flex flex-col gap-2">
                {['/reparation', '/location', '/vente-vehicule', '/vente-moto'].map((href) => (
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
            <p className="cp-mono text-cp-cream/20 text-xs">Guadeloupe · 971</p>
          </div>
        </div>
      </footer>
    </>
  );
}
