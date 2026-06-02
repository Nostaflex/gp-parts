import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { getAdapter } from '@/lib/data';
import { LocationClient } from './LocationClient';

export const metadata: Metadata = {
  title: 'Location de véhicules — Racoon',
  description:
    'Location de voitures Racoon en Guadeloupe. Explore la Guadeloupe en toute liberté. Kilométrage illimité, assurance incluse, disponible dès demain.',
};

export const dynamic = 'force-dynamic';

export default async function LocationPage() {
  const adapter = await getAdapter();
  const cars = (await adapter.getLocationCars()).filter((c) => c.disponible);
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
              Racoon · Disponible immédiatement
            </p>
            <h1
              className="cp-title font-black leading-none mb-6"
              style={{ color: '#F8EDD8', fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              EXPLORE LA
              <br />
              <span style={{ color: '#E9C46A' }}>GUADELOUPE</span>
              <br />
              EN TOUTE LIBERTÉ
            </h1>
            <p
              className="text-base leading-relaxed max-w-md mb-8"
              style={{ color: 'rgba(192,144,96,0.9)' }}
            >
              Notre flotte Racoon : véhicules récents, kilométrage illimité, remis en main propre.
              Réservez en ligne, récupérez votre véhicule dès demain.
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

          {/* Image — véhicule Racoon */}
          <div
            className="hidden md:flex h-full relative overflow-hidden items-center justify-center"
            style={{ minHeight: '450px' }}
          >
            <Image
              src="/images/vehicule-racoon.webp"
              alt="Véhicule Racoon — flotte de location Car Performance Guadeloupe"
              width={2000}
              height={1333}
              priority
              sizes="(max-width: 1024px) 90vw, 50vw"
              className="w-full h-auto object-contain"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, rgba(28,14,4,0.4) 0%, transparent 30%)',
              }}
            />
          </div>
        </div>
      </section>

      <CpBridge fromColor="#1E0E04" toColor="#F4EDE0" />

      {/* ── CLIENT COMPONENT (search + catalogue + form) ── */}
      <LocationClient cars={cars} />

      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
