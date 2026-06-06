import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { VenteVehiculeClient } from './VenteVehiculeClient';
import { getCachedVehicules } from '@/lib/data/vehicules-cache';
import Link from 'next/link';
import Image from 'next/image';

// Symétrie ISR avec [id]/page.tsx : revalidateTag('vehicules') prime sur
// mutation ; ce TTL n'est qu'un fallback de fraîcheur.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Vente de véhicules — Occasion & Neuf',
  description:
    "Achetez un véhicule d'occasion contrôlé ou neuf à commander en Guadeloupe. Garantie incluse, financement sur mesure. Toutes marques.",
};

export default async function VenteVehiculePage() {
  const vehicules = await getCachedVehicules();

  return (
    <>
      <CpHeader darkSectionIds={['vo-hero']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="vo-hero"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#1E0E04' }}
      >
        {/* Fond plein cadre — vraie photo d'un véhicule français (Peugeot 308),
            étalonnée chaud/sombre + dégradés multi-bords pour fondre dans le
            #1E0E04 sans rectangle. Masqué en mobile (lisibilité du texte). */}
        <div aria-hidden="true" className="absolute inset-0 hidden md:block">
          <Image
            src="/images/hero-vente-vehicule.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 0px, 100vw"
            className="object-cover object-[60%_center]"
          />
          {/* Scrim gauche → texte lisible ; la voiture émerge à droite */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, #1E0E04 0%, rgba(30,14,4,0.82) 32%, rgba(30,14,4,0.12) 68%, rgba(30,14,4,0) 100%)',
            }}
          />
          {/* Fondu haut + bas vers la couleur de section (zéro arête) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, #1E0E04 0%, transparent 22%, transparent 68%, #1E0E04 100%)',
            }}
          />
          {/* Halo chaud discret bas-droite — remplace l'aplat jaune qui jurait */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '520px',
              height: '520px',
              bottom: '-10%',
              right: '3%',
              background: 'radial-gradient(circle, rgba(217,38,39,0.10) 0%, transparent 70%)',
            }}
          />
        </div>

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
              <span style={{ color: 'rgba(248,237,216,0.6)' }}>Vente véhicule</span>
            </nav>

            <p
              className="cp-mono text-xs tracking-widest uppercase mb-5"
              style={{ color: '#E9C46A' }}
            >
              Véhicules contrôlés · Garantie incluse
            </p>
            <h1
              className="cp-title font-black leading-none mb-6"
              style={{ color: '#F8EDD8', fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              VENTE
              <br />
              <span style={{ color: '#D92627' }}>OCCASION</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-md mb-8"
              style={{ color: 'rgba(192,144,96,0.9)' }}
            >
              Chaque véhicule est contrôlé par nos techniciens, garanti 12 mois et prêt à rouler.
              Financement sur mesure disponible.
            </p>

            {/* Garanties pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                'Contrôlé par nos techniciens',
                'Garantie 12 mois incluse',
                'Financement disponible',
                'Reprise possible',
              ].map((g) => (
                <span
                  key={g}
                  className="cp-mono text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(233,196,106,0.08)',
                    border: '1px solid rgba(233,196,106,0.15)',
                    color: 'rgba(192,144,96,0.9)',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Badge stock */}
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
                Stock disponible
              </p>
              <p className="cp-title font-black text-xl mt-1" style={{ color: '#F8EDD8' }}>
                5 véhicules
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(128,96,64,0.9)' }}>
                Mis à jour régulièrement
              </p>
            </div>
          </div>

          {/* Colonne droite laissée vide : la voiture vit dans le fond plein cadre */}
        </div>
      </section>

      <CpBridge fromColor="#1E0E04" toColor="#F4EDE0" />

      {/* ── CLIENT COMPONENT (catalogue + financement) ── */}
      <VenteVehiculeClient vehicules={vehicules} />

      {/* Bridge financement → footer */}
      <CpBridge fromColor="#2C1A08" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
