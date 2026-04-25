import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { RdvForm } from './RdvForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Réparation & RDV',
  description:
    'Prenez rendez-vous en ligne pour votre réparation auto ou moto. Réponse sous 1h, devis gratuit, toutes marques en Guadeloupe.',
};

const PROMISES = [
  {
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Confirmation en 1h',
    desc: 'Email immédiat, appel de validation sous 1h en jours ouvrés.',
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Devis gratuit',
    desc: 'Estimation transparente avant tout travail. Aucune surprise.',
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: 'Véhicule de remplacement',
    desc: 'Location disponible pendant la durée de votre réparation.',
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: 'Toutes marques',
    desc: 'Auto et moto, toutes marques, toutes motorisations.',
  },
];

export default function ReparationPage() {
  return (
    <>
      <CpHeader darkSectionIds={['rep-hero']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="rep-hero"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#0D0905' }}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-0 items-end min-h-[70vh]">
          {/* Texte */}
          <div className="py-16 md:py-24">
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
              <span className="text-cp-cream/60">Réparation</span>
            </nav>

            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-5">
              Prise en charge express
            </p>
            <h1
              className="cp-title font-black text-cp-cream leading-none mb-6"
              style={{ fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              RÉSERVEZ
              <br />
              <span className="text-cp-mango">VOTRE RDV</span>
            </h1>
            <p className="text-cp-cream/55 text-base leading-relaxed max-w-md mb-8">
              Décrivez votre problème, choisissez votre créneau. Nous vous confirmons par email dans
              l&apos;heure.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Toutes marques', 'Réponse &lt; 1h', 'Devis gratuit'].map((pill, i) => (
                <span
                  key={i}
                  className="cp-mono text-xs text-cp-cream/50 border border-cp-cream/15 px-3 py-1.5 rounded-full"
                  dangerouslySetInnerHTML={{ __html: pill }}
                />
              ))}
            </div>
          </div>

          {/* Image */}
          <div
            className="hidden md:block h-full relative overflow-hidden"
            style={{ minHeight: '400px' }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=900&q=80&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0905] via-[#0D0905]/20 to-transparent" />
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#F4EDE0" />

      {/* ── FORMULAIRE RDV ───────────────────── */}
      <section className="py-24 px-6 pt-32" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Promesses */}
          <div>
            <p className="cp-mono text-cp-ink/35 text-xs tracking-widest uppercase mb-4">
              Prise de rendez-vous
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none mb-8"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
            >
              SIMPLE,
              <br />
              RAPIDE,
              <br />
              <em className="text-cp-mango not-italic">CONFIRMÉ</em>
            </h2>
            <p className="text-cp-ink/60 text-base leading-relaxed mb-10 max-w-md">
              Remplissez le formulaire en 2 minutes. Notre équipe vous rappelle pour confirmer le
              créneau et vous donne une première estimation.
            </p>
            <div className="flex flex-col gap-6">
              {PROMISES.map((p) => (
                <div key={p.title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-cp-ink/8 flex items-center justify-center text-cp-mango flex-shrink-0">
                    {p.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-cp-ink text-sm mb-0.5">{p.title}</p>
                    <p className="text-cp-ink/50 text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire multi-étapes */}
          <RdvForm />
        </div>
      </section>

      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
