import type { ReactNode } from 'react';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';

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
