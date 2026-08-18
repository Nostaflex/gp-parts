import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { CpUniversStrip } from '@/components/cp/CpUniversStrip';
import { VenteVehiculeClient } from './VenteVehiculeClient';
import { getCachedVehicules } from '@/lib/data/vehicules-cache';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Symétrie ISR avec [id]/page.tsx : revalidateTag('vehicules') prime sur
// mutation ; ce TTL n'est qu'un fallback de fraîcheur.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Vente de véhicules — Occasion & Neuf',
  description:
    "Achetez un véhicule d'occasion contrôlé ou neuf à commander en Guadeloupe. Garantie incluse, financement sur mesure. Toutes marques.",
  alternates: { canonical: '/vente-vehicule' },
};

export default async function VenteVehiculePage() {
  const flags = await getCachedFeatureFlags();
  if (!flags.venteVehicule) notFound();
  const vehicules = await getCachedVehicules();
  // Le stock annoncé au hero = les VRAIS disponibles (ni réservés ni vendus).
  const nbDisponibles = vehicules.filter((v) => v.disponibilite === 'disponible').length;
  const nbReserves = vehicules.filter((v) => v.disponibilite === 'reserve').length;
  const nbVendus = vehicules.filter((v) => v.disponibilite === 'vendu').length;

  return (
    <>
      <CpHeader darkSectionIds={['vo-hero']} />

      {/* ── HERO — BLANC (handoff §5 : le rouge plein est anxiogène sur un
          achat à 8 000 € ; le rouge ne sert plus que d'accent) ──────────── */}
      <section
        id="vo-hero"
        data-cp-light="true"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* Photo : UNE seule voiture (le coupé droit du triptyque, recadré),
            virée aux TONS BLEUS par filtre CSS — dépannage assumé par la
            maquette cp-v4. TODO Djemil/Stéphane : vraie photo d'une berline
            bleue, seule, sur fond clair. Masquée en mobile : la photo devient
            un bandeau sous le texte (le contraste ne tient pas autrement). */}
        <div aria-hidden="true" className="absolute inset-0 hidden md:block">
          <Image
            src="/images/hero-vente-vehicule.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 0px, 100vw"
            className="object-cover"
            style={{
              objectPosition: 'center',
              transform: 'scale(1.25)',
              transformOrigin: '85% 60%',
              filter: 'brightness(1.18) contrast(0.96) hue-rotate(196deg) saturate(0.78)',
            }}
          />
          {/* Plateau blanc opaque jusqu'à 58 % — aucun texte sur zone < .9 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, #FFFFFF 0%, #FFFFFF 58%, rgba(255,255,255,0.92) 72%, rgba(255,255,255,0.3) 88%, rgba(255,255,255,0) 100%)',
            }}
          />
          {/* Fondu haut + bas vers le blanc de section (zéro arête) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, #FFFFFF 0%, transparent 26%, transparent 62%, rgba(255,255,255,0.9) 92%, #FFFFFF 100%)',
            }}
          />
          {/* Orbe rouge discret bas-droite — le rouge reste un accent */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '520px',
              height: '520px',
              bottom: '-14%',
              right: '2%',
              background: 'radial-gradient(circle, rgba(217,38,39,0.10) 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-0 items-end min-h-[75vh] relative z-10">
          {/* Texte — encre sur blanc, colonne ≤ 50 % */}
          <div className="py-16 md:py-24">
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center gap-2 text-xs mb-8"
              style={{ color: 'rgba(26,15,6,0.4)' }}
            >
              <Link href="/" className="hover:text-[#B81F20] transition-colors">
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
              <span style={{ color: 'rgba(26,15,6,0.7)' }}>Vente véhicule</span>
            </nav>

            <p
              className="cp-mono text-xs tracking-widest uppercase mb-5"
              style={{ color: '#D92627' }}
            >
              Véhicules contrôlés · Garantie incluse
            </p>
            <h1
              className="cp-title font-black leading-none mb-6"
              style={{ color: '#1A0F06', fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              VENTE
              <br />
              <span style={{ color: '#D92627' }}>OCCASION</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-md mb-8"
              style={{ color: 'rgba(26,15,6,0.62)' }}
            >
              Chaque véhicule est contrôlé par nos techniciens, garanti 12 mois et prêt à rouler.
              Financement sur mesure disponible.
            </p>

            {/* Garanties pills — rouges en contour, jamais en aplat */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                'Contrôlé par nos techniciens',
                'Garantie 12 mois incluse',
                'Financement 4,99 % TAEG',
                'Reprise possible',
              ].map((g) => (
                <span
                  key={g}
                  className="cp-mono text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(217,38,39,0.07)',
                    border: '1px solid rgba(217,38,39,0.22)',
                    color: '#B81F20',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Badge stock — carte blanche, disponibilité ÉCRITE */}
            <div
              className="inline-flex flex-col rounded-2xl p-4 bg-white"
              style={{
                border: '1px solid rgba(217,38,39,0.18)',
                boxShadow: '0 16px 32px -18px rgba(26,15,6,0.25)',
              }}
            >
              <p
                className="cp-mono text-[0.65rem] tracking-widest uppercase flex items-center gap-2"
                style={{ color: '#B81F20' }}
              >
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#D92627' }}
                />
                Stock disponible
              </p>
              <p className="cp-title font-black text-xl mt-1" style={{ color: '#1A0F06' }}>
                {nbDisponibles > 0
                  ? `${nbDisponibles} véhicule${nbDisponibles > 1 ? 's' : ''}`
                  : 'Arrivages en cours'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(26,15,6,0.45)' }}>
                sur {vehicules.length} annonce{vehicules.length > 1 ? 's' : ''}
                {nbReserves > 0 ? ` · ${nbReserves} réservé${nbReserves > 1 ? 's' : ''}` : ''}
                {nbVendus > 0 ? ` · ${nbVendus} vendu${nbVendus > 1 ? 's' : ''}` : ''}
              </p>
            </div>

            {/* Mobile : la photo SORT du fond — bandeau sous le texte (cp-v5) */}
            <div className="md:hidden mt-8 relative h-[180px] rounded-2xl overflow-hidden">
              <Image
                src="/images/hero-vente-vehicule.webp"
                alt="Véhicule d'occasion contrôlé — Car Performance Guadeloupe"
                fill
                sizes="100vw"
                className="object-cover"
                style={{
                  transform: 'scale(2.3)',
                  transformOrigin: '76% 55%',
                  filter: 'brightness(1.12) contrast(0.96) hue-rotate(196deg) saturate(0.78)',
                }}
              />
            </div>
          </div>

          {/* Colonne droite laissée vide : la voiture vit dans le fond plein cadre */}
        </div>
      </section>

      <CpBridge fromColor="#FFFFFF" toColor="#F4EDE0" accentColor="#D92627" />

      {/* ── CLIENT COMPONENT (catalogue + financement) ── */}
      <VenteVehiculeClient vehicules={vehicules} />

      {/* Bridge financement → footer */}
      <CpBridge fromColor="#2C1A08" toColor="#1A0F06" />
      <CpUniversStrip current="vente-vehicule" tone="dark" />
      <CpFooter />
    </>
  );
}
