import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { CpUniversStrip } from '@/components/cp/CpUniversStrip';
import { VenteMotoClient } from './VenteMotoClient';
import { getCachedMotos } from '@/lib/data/motos-cache';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Symétrie ISR avec [id]/page.tsx : revalidateTag('motos') prime sur
// mutation ; ce TTL n'est qu'un fallback de fraîcheur.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Vente de motos — Occasion & Neuf',
  description:
    "Achetez une moto d'occasion contrôlée ou neuve à commander en Guadeloupe. Roadster, sport, trail, scooter — toutes cylindrées. Garantie incluse, financement sur mesure.",
  alternates: { canonical: '/vente-moto' },
};

export default async function VenteMotoPage() {
  const flags = await getCachedFeatureFlags();
  if (!flags.venteMoto) notFound();
  const motos = await getCachedMotos();

  return (
    <>
      <CpHeader darkSectionIds={['moto-hero']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="moto-hero"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#1E0E04' }}
      >
        {/* Fond plein cadre — vraie photo moto (Yamaha Tracer 9, bord de mer),
            étalonnée chaud/sombre + dégradés multi-bords pour fondre dans le
            #1E0E04 sans rectangle. Masqué en mobile (lisibilité du texte). */}
        <div aria-hidden="true" className="absolute inset-0 hidden md:block">
          <Image
            src="/images/hero-vente-moto.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 0px, 100vw"
            className="object-cover object-[center_55%]"
          />
          {/* Scrim gauche → texte lisible ; la moto émerge à droite */}
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
              <span style={{ color: 'rgba(248,237,216,0.6)' }}>Vente moto</span>
            </nav>

            <p
              className="cp-mono text-xs tracking-widest uppercase mb-5"
              style={{ color: '#E9C46A' }}
            >
              Motos contrôlées · Garantie incluse
            </p>
            <h1
              className="cp-title font-black leading-none mb-6"
              style={{ color: '#F8EDD8', fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              VENTE
              <br />
              <span style={{ color: '#D92627' }}>MOTO</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-md mb-8"
              style={{ color: 'rgba(192,144,96,0.9)' }}
            >
              Chaque moto est contrôlée par nos techniciens, garantie et prête à rouler. Roadster,
              sport, trail, scooter — toutes cylindrées disponibles.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {[
                'Contrôlée par nos techniciens',
                'Garantie incluse',
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
          </div>

          {/* Colonne droite laissée vide : la moto vit dans le fond plein cadre */}
        </div>
      </section>

      <CpBridge fromColor="#1E0E04" toColor="#F4EDE0" />

      {/* ── CATALOGUE + REPRISE (client) ── */}
      <VenteMotoClient motos={motos} />

      <CpUniversStrip current="vente-moto" />
      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
