import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { LocationClient } from './LocationClient';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Location de véhicules',
  description:
    'Location de voitures en Guadeloupe. Kilométrage illimité, assurance incluse, disponible dès demain. Citadines, berlines, SUV et utilitaires.',
};

export default function LocationPage() {
  return (
    <>
      <CpHeader darkSectionIds={['loc-hero']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="loc-hero"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#1E0E04' }}
      >
        {/* Orbs décoratifs */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '600px',
            height: '600px',
            top: '50%',
            left: '70%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(233,196,106,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '350px',
            height: '350px',
            top: '70%',
            left: '15%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(232,114,0,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-0 items-end min-h-[75vh] relative z-10">
          {/* Texte */}
          <div className="py-16 md:py-24">
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center gap-2 text-xs mb-8"
              style={{ color: 'rgba(248,237,216,0.3)' }}
            >
              <Link href="/" className="hover:text-[#E9C46A] transition-colors">
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
              <span style={{ color: 'rgba(248,237,216,0.6)' }}>Location</span>
            </nav>

            <p
              className="cp-mono text-xs tracking-widest uppercase mb-5"
              style={{ color: '#E9C46A' }}
            >
              Disponible immédiatement
            </p>
            <h1
              className="cp-title font-black leading-none mb-6"
              style={{ color: '#F8EDD8', fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              LOCATION
              <br />
              <span style={{ color: '#E9C46A' }}>EN GUADELOUPE</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-md mb-8"
              style={{ color: 'rgba(192,144,96,0.9)' }}
            >
              Véhicules récents, kilométrage illimité, remis en main propre. Réservez en ligne,
              récupérez votre véhicule dès demain.
            </p>

            {/* Avantages */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { label: 'Km illimité' },
                { label: 'Assurance incluse' },
                { label: 'Dispo dès demain' },
                { label: 'Sans frais de retour' },
              ].map((a) => (
                <span
                  key={a.label}
                  className="cp-mono text-xs px-3 py-1.5 rounded-full flex items-center gap-2"
                  style={{
                    background: 'rgba(233,196,106,0.08)',
                    border: '1px solid rgba(233,196,106,0.15)',
                    color: 'rgba(192,144,96,0.9)',
                  }}
                >
                  {a.label}
                </span>
              ))}
            </div>

            {/* Badge flotte */}
            <div
              className="inline-flex flex-col rounded-2xl p-4"
              style={{
                background: 'rgba(28,14,4,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(233,196,106,0.18)',
              }}
            >
              <p
                className="cp-mono text-[0.65rem] tracking-widest uppercase"
                style={{ color: '#E9C46A' }}
              >
                Flotte disponible
              </p>
              <p className="cp-title font-black text-xl mt-1" style={{ color: '#F8EDD8' }}>
                12 véhicules
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(128,96,64,0.9)' }}>
                Mise à jour en temps réel
              </p>
            </div>
          </div>

          {/* Image */}
          <div
            className="hidden md:block h-full relative overflow-hidden"
            style={{ minHeight: '450px' }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&q=80&fit=crop')",
                filter: 'brightness(0.6) saturate(0.85)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, rgba(28,14,4,0.65) 0%, transparent 50%)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-2/5"
              style={{ background: 'linear-gradient(to top, #1E0E04 0%, transparent 100%)' }}
            />
          </div>
        </div>
      </section>

      <CpBridge fromColor="#1E0E04" toColor="#F4EDE0" />

      {/* ── CLIENT COMPONENT (search + catalogue + form) ── */}
      <LocationClient />

      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
