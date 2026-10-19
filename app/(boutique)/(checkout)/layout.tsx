import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';

/**
 * SEO lot 1 (2026-10-11) : panier, commande et compte sont des surfaces privées,
 * jamais indexées — meta robots ici, en-tête X-Robots-Tag dans next.config.js
 * (P1.1 de l'audit du 19/08).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CpHeader />

      {/* Spacer header */}
      <div style={{ height: '68px' }} />

      {/* Contenu sur fond craft */}
      <div style={{ backgroundColor: '#F8F5F0', minHeight: '60vh' }} className="pt-10 pb-24">
        {children}
      </div>

      <CpBridge fromColor="#F8F5F0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
