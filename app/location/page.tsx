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
        data-cp-light="true"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#FBF8F1' }}
      >
        {/* Orbs décoratifs — wash tropical (vert + orange Racoon) */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '600px',
            height: '600px',
            top: '45%',
            left: '72%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(82,200,138,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '420px',
            height: '420px',
            top: '72%',
            left: '12%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(232,114,0,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-0 items-end min-h-[75vh] relative z-10">
          {/* Texte */}
          <div className="py-16 md:py-24">
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center gap-2 text-xs mb-8"
              style={{ color: 'rgba(26,15,6,0.4)' }}
            >
              <Link href="/" className="hover:text-[#2A5C45] transition-colors">
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
              <span style={{ color: 'rgba(26,15,6,0.7)' }}>Location</span>
            </nav>

            <p
              className="cp-mono text-xs tracking-widest uppercase mb-5"
              style={{ color: '#E87200' }}
            >
              Racoon · Disponible immédiatement
            </p>
            <h1
              className="cp-title font-black leading-none mb-6"
              style={{ color: '#1A0F06', fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              EXPLORE LA
              <br />
              <span style={{ color: '#E87200' }}>GUADELOUPE</span>
              <br />
              EN TOUTE LIBERTÉ
            </h1>
            <p
              className="text-base leading-relaxed max-w-md mb-8"
              style={{ color: 'rgba(26,15,6,0.6)' }}
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
                    background: 'rgba(82,200,138,0.12)',
                    border: '1px solid rgba(42,92,69,0.22)',
                    color: '#2A5C45',
                  }}
                >
                  {a.label}
                </span>
              ))}
            </div>

            {/* Badge flotte */}
            <div
              className="inline-flex flex-col rounded-2xl p-4 bg-white"
              style={{
                border: '1px solid rgba(42,92,69,0.18)',
                boxShadow: '0 16px 32px -18px rgba(26,15,6,0.25)',
              }}
            >
              <p
                className="cp-mono text-[0.65rem] tracking-widest uppercase flex items-center gap-2"
                style={{ color: '#E87200' }}
              >
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#52C88A' }}
                />
                Flotte disponible
              </p>
              <p className="cp-title font-black text-xl mt-1" style={{ color: '#1A0F06' }}>
                12 véhicules
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(26,15,6,0.45)' }}>
                Mise à jour en temps réel
              </p>
            </div>
          </div>

          {/* Image — véhicule Racoon, posée en carte produit blanche (le fond blanc de
              l'image devient la surface de la carte → plus de rectangle blanc qui jure) */}
          <div
            className="hidden md:flex h-full relative items-center justify-center py-12"
            style={{ minHeight: '450px' }}
          >
            <div className="relative w-full overflow-hidden rounded-[1.75rem] bg-white p-6 ring-1 ring-cp-ink/5 shadow-[0_30px_60px_-24px_rgba(26,15,6,0.28)]">
              {/* halos tropicaux dans les coins — rappel des couleurs du wrap Racoon */}
              <div
                aria-hidden="true"
                className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(232,114,0,0.20) 0%, transparent 70%)' }}
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(82,200,138,0.20) 0%, transparent 70%)' }}
              />
              <Image
                src="/images/vehicule-racoon.webp"
                alt="Véhicule Racoon — flotte de location Car Performance Guadeloupe"
                width={2000}
                height={1333}
                priority
                sizes="(max-width: 1024px) 90vw, 50vw"
                className="relative z-10 w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <CpBridge fromColor="#FBF8F1" toColor="#F4EDE0" />

      {/* ── CLIENT COMPONENT (search + catalogue + form) ── */}
      <LocationClient cars={cars} />

      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
