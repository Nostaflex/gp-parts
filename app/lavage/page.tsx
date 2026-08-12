import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { FORMULES } from './formules';
import { LavageForm } from './LavageForm';

export const metadata: Metadata = {
  title: 'Lavage auto — RDV en ligne',
  description:
    'Lavage auto et moto en Guadeloupe : extérieur, intérieur, complet ou rénovation. Prenez votre créneau en ligne, réponse sous 48h en jours ouvrés.',
  alternates: { canonical: '/lavage' },
};

export default async function LavagePage() {
  const flags = await getCachedFeatureFlags();
  if (!flags.lavage) notFound();

  return (
    <>
      <CpHeader darkSectionIds={['lav-hero']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="lav-hero"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#0D0905' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 min-h-[55vh] flex flex-col justify-end">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-xs text-cp-cream/30 mb-8"
          >
            <Link href="/" className="hover:text-cp-mango transition-colors">
              Accueil
            </Link>
            <svg
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="text-cp-cream/60">Lavage</span>
          </nav>

          <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-5">
            Lavage auto & moto
          </p>
          <h1
            className="cp-title font-black text-cp-cream leading-none mb-6"
            style={{ fontSize: 'clamp(3rem, 7vw, 7rem)' }}
          >
            VOTRE VÉHICULE
            <br />
            <span className="text-cp-red">COMME NEUF</span>
          </h1>
          <p className="text-cp-cream/55 text-base leading-relaxed max-w-md mb-8">
            Extérieur, intérieur, complet ou rénovation. Choisissez votre formule et votre créneau —
            notre équipe vous confirme sous 48h en jours ouvrés.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Sur rendez-vous', 'Produits professionnels', 'Auto & moto'].map((pill) => (
              <span
                key={pill}
                className="cp-mono text-xs text-cp-cream/50 border border-cp-cream/15 px-3 py-1.5 rounded-full"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#F4EDE0" />

      {/* ── FORMULES ─────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          <p className="cp-mono text-cp-ink/35 text-xs tracking-widest uppercase mb-4">
            Nos formules
          </p>
          <h2
            className="cp-title font-black text-cp-ink leading-none mb-12"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
          >
            QUATRE FORMULES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {FORMULES.map((f) => (
              <div
                key={f.nom}
                className="bg-white rounded-2xl border border-[#E5DDD3] p-6 flex flex-col"
              >
                <h3 className="cp-title font-black text-cp-ink text-2xl mb-2">
                  {f.nom.toUpperCase()}
                </h3>
                <p className="text-cp-ink/55 text-sm leading-relaxed mb-4">{f.desc}</p>
                <ul className="flex flex-col gap-2 mb-6">
                  {f.inclus.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-cp-ink/70">
                      <span className="text-[#52C88A] mt-0.5" aria-hidden="true">
                        ✓
                      </span>
                      {i}
                    </li>
                  ))}
                </ul>
                <p className="cp-mono text-cp-mango text-sm tracking-wide mt-auto">{f.prix}</p>
              </div>
            ))}
          </div>

          {/* ── RDV ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="cp-mono text-cp-ink/35 text-xs tracking-widest uppercase mb-4">
                Prise de rendez-vous
              </p>
              <h2
                className="cp-title font-black text-cp-ink leading-none mb-8"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
              >
                RÉSERVEZ
                <br />
                <em className="text-cp-red not-italic">VOTRE CRÉNEAU.</em>
              </h2>
              <p className="text-cp-ink/60 text-base leading-relaxed mb-10 max-w-md">
                Un rendez-vous dédié au lavage, distinct de l&apos;atelier : choisissez votre
                formule, votre date et votre créneau. Notre équipe confirme et vous précise le tarif
                selon l&apos;état et la taille du véhicule.
              </p>
            </div>
            <LavageForm />
          </div>
        </div>
      </section>

      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
