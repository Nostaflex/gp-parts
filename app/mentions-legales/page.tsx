import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { LegalTabs } from './LegalTabs';

export const metadata: Metadata = {
  title: 'Mentions légales & Confidentialité',
  description:
    'Mentions légales, CGV, politique de confidentialité et cookies de Car Performance Guadeloupe.',
};

export default function MentionsLegalesPage() {
  return (
    <>
      <CpHeader darkSectionIds={['legal-hero']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="legal-hero"
        className="relative pt-28 pb-16 px-6 overflow-hidden"
        style={{ backgroundColor: '#0D0905' }}
      >
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '400px',
            height: '400px',
            top: '50%',
            left: '60%',
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(232,114,0,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-4">
            Car Performance Guadeloupe · Informations légales
          </p>
          <h1
            className="cp-title font-black text-cp-cream leading-none"
            style={{ fontSize: 'clamp(2.5rem,6vw,6rem)' }}
          >
            MENTIONS
            <br />
            LÉGALES &<br />
            <span className="text-cp-mango">CONFIDENTIALITÉ</span>
          </h1>
          <p className="text-cp-cream/40 text-sm mt-4">Mise à jour — Janvier 2025</p>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#F8F5F0" />

      {/* ── CONTENU ──────────────────────────── */}
      <section className="py-16 px-6 pt-24" style={{ backgroundColor: '#F8F5F0' }}>
        <LegalTabs />
      </section>

      <CpBridge fromColor="#F8F5F0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
