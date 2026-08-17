import type { Metadata } from 'next';
import { AvisSection } from '@/components/cp/AvisSection';
import Image from 'next/image';
import Link from 'next/link';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpLogo } from '@/components/cp/CpLogo';
import { CpReveal } from '@/components/cp/CpReveal';
import { CpUniversCard } from '@/components/cp/CpUniversCard';
import { CpOpenBadge } from '@/components/cp/CpOpenBadge';
import { isPathVisible } from '@/lib/feature-flags';
import { addressOneLine, whatsappUrl } from '@/lib/contact-info';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';

export const metadata: Metadata = {
  title: 'Garage auto & moto en Guadeloupe',
  description:
    'Car Performance — Garage auto & moto en Guadeloupe. Réparation, location et vente de véhicules.',
};

const UNIVERS = [
  {
    id: 'reparation',
    href: '/reparation',
    label: 'Réparation',
    tag: '01',
    desc: 'Mécanique, carrosserie, entretien. Devis gratuit, prise en charge rapide.',
    accent: '#E87200',
    img: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=900&q=80&fit=crop',
  },
  // « Il manque un bloc pour le lavage » (mail Stéphane 2026-08-15) ; en 02
  // avec l'univers bleu de Splash (handoff design 2026-08-17, maquette cp-v4).
  {
    id: 'lavage',
    href: '/lavage',
    label: 'Esthétique auto',
    tag: '02',
    desc: 'SPLASH, l’expert de l’entretien auto — Premium Wash ou Ultimate Wash, lavage manuel sur rendez-vous.',
    accent: '#3CC5DE',
    img: '/images/splash/atelier-lavage.png',
    veil: 'linear-gradient(to top, rgba(6,39,48,0.94) 0%, rgba(14,143,166,0.55) 55%, rgba(14,143,166,0.3) 100%)',
    mascotte: { src: '/images/mascottes/splash-gant.webp', alt: 'Splash, mascotte iguane' },
  },
  {
    id: 'location',
    href: '/location',
    label: 'Location',
    tag: '03',
    desc: 'Location de véhicules Racoon — kilométrage illimité, assurance incluse, disponible dès demain.',
    accent: '#52C88A',
    img: '/images/location/toyota-yaris.jpg',
    veil: 'linear-gradient(to top, rgba(20,54,38,0.94) 0%, rgba(42,92,69,0.55) 55%, rgba(82,200,138,0.28) 100%)',
    mascotte: { src: '/images/mascottes/max.webp', alt: 'Max, mascotte raton laveur' },
  },
  {
    id: 'vente-vehicule',
    href: '/vente-vehicule',
    label: 'Vente véhicule',
    tag: '04',
    desc: "Véhicules d'occasion ou neufs, contrôlés et garantis par nos soins.",
    accent: '#2A5C45',
    img: '/images/hero-vente-vehicule.webp',
  },
  {
    id: 'vente-moto',
    href: '/vente-moto',
    label: 'Vente moto',
    tag: '05',
    desc: 'Roadster, sport, trail, scooter — toutes cylindrées, occasion ou neuf.',
    accent: '#C8392E',
    img: '/images/hero-vente-moto.webp',
  },
  {
    id: 'pieces',
    href: '/pieces',
    label: 'Pièces détachées',
    tag: '06',
    desc: 'Auto & moto, livrées partout en Guadeloupe. Commande en ligne, retrait boutique ou livraison 24-48h.',
    accent: '#E9C46A',
    img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=80&fit=crop',
  },
];

const STATS = [
  { value: '971', unit: '', label: 'Guadeloupe' },
  { value: '48h', unit: '', label: 'délai de réponse — jours ouvrés' },
  { value: '12', unit: 'mois', label: 'garantie pièces' },
  { value: '4.99', unit: '%', label: 'financement TAEG' },
];

const HORAIRES = [
  { jour: 'Lundi – Vendredi', horaire: '07:30 – 17:30' },
  { jour: 'Samedi', horaire: '08:00 – 13:00' },
  { jour: 'Dimanche', horaire: 'Fermé' },
];

export default async function HomePage() {
  const flags = await getCachedFeatureFlags();
  const ci = await getCachedContactInfo();
  const univers = UNIVERS.filter((u) => isPathVisible(u.href, flags));
  const servicesLinks = ['/reparation', '/location', '/vente-vehicule', '/vente-moto'].filter(
    (href) => isPathVisible(href, flags)
  );

  return (
    <>
      <CpHeader darkSectionIds={['hero', 'stats', 'temoignages', 'contact', 'footer-section']} />

      {/* ── HERO ────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-dvh flex flex-col justify-center px-6 pt-24 pb-16 overflow-hidden"
        style={{ backgroundColor: '#0D0905' }}
      >
        {/* Photo de fond + voiles — le texte reste sur zone sombre garantie */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=70&fit=crop"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, #0D0905 0%, rgba(13,9,5,0.82) 45%, rgba(13,9,5,0.45) 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{ background: 'linear-gradient(to top, #0D0905, transparent)' }}
          />
          <div
            className="absolute rounded-full animate-cp-orb"
            style={{
              width: '600px',
              height: '600px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(232,114,0,0.12) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute rounded-full animate-cp-orb"
            style={{
              width: '400px',
              height: '400px',
              top: '20%',
              right: '10%',
              animationDelay: '-3s',
              background: 'radial-gradient(circle, rgba(233,196,106,0.08) 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <CpReveal>
            <p className="cp-mono text-cp-mango text-sm tracking-widest uppercase mb-6">
              Garage · Guadeloupe 971
            </p>
          </CpReveal>
          <CpReveal delay={1}>
            <h1
              className="cp-title font-black leading-none mb-8 text-cp-cream"
              style={{ fontSize: 'clamp(2rem, 10.5vw, 9rem)' }}
            >
              CAR
              <br />
              <span className="text-cp-red">PERFORMANCE</span>
            </h1>
          </CpReveal>
          <CpReveal delay={2}>
            <p className="text-cp-cream/60 text-lg max-w-xl mb-10 leading-relaxed">
              Centre de maintenance et réparation automobile digital.
              <br />
              L&apos;innovation automobile au service de la performance.
            </p>
          </CpReveal>
          <CpReveal delay={3}>
            <div className="flex flex-wrap gap-4">
              {flags.reparation && (
                <Link
                  href="/reparation"
                  className="inline-flex items-center gap-2 bg-cp-red text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-red-d active:scale-[0.98] transition-[background-color,transform]"
                >
                  Prendre RDV
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              {flags.venteVehicule && (
                <Link
                  href="/vente-vehicule"
                  className="inline-flex items-center gap-2 border border-cp-cream/30 text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-cream/10 active:scale-[0.98] transition-[background-color,transform]"
                >
                  Voir les véhicules
                </Link>
              )}
            </div>
          </CpReveal>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#F4EDE0" />

      {/* ── UNIVERS ─────────────────────────────── */}
      <section
        id="univers"
        data-cp-light="true"
        className="py-24 px-6"
        style={{ backgroundColor: '#F4EDE0' }}
      >
        <div className="max-w-7xl mx-auto">
          <CpReveal>
            <p className="cp-mono text-cp-ink/40 text-xs tracking-widest uppercase mb-3">
              Nos services
            </p>
            <h2
              className="cp-title text-cp-ink font-black leading-none mb-16"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
            >
              NOS UNIVERS
            </h2>
          </CpReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 6 cartes = grille 3×2 complète — écart assumé avec la maquette
                cp-v4 (Pièces en pleine largeur) : 5 cartes simples + 1 wide
                recréeraient le trou signalé par Stéphane (15/08). */}
            {univers.map((u, i) => (
              <CpReveal key={u.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <CpUniversCard univers={u} />
              </CpReveal>
            ))}
          </div>
        </div>
      </section>

      <CpBridge fromColor="#F4EDE0" toColor="#0D0905" />

      {/* ── STATS ───────────────────────────────── */}
      <section id="stats" className="py-24 px-6" style={{ backgroundColor: '#0D0905' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <CpReveal key={s.label} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="text-center">
                <p
                  className="cp-title text-cp-red font-black leading-none mb-2"
                  style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}
                >
                  {s.value}
                  <span className="text-cp-cream/40 text-2xl ml-1">{s.unit}</span>
                </p>
                <p className="text-cp-cream/50 text-sm uppercase tracking-wider">{s.label}</p>
              </div>
            </CpReveal>
          ))}
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#1A1208" />

      {/* ── AVIS CLIENTS (réels, modérés — jamais de faux avis, L121-4) ── */}
      <AvisSection visible={flags.avis} />

      <CpBridge fromColor="#1A1208" toColor="#0E1F18" />

      {/* ── CONTACT + HORAIRES ──────────────────── */}
      <section id="contact" className="py-24 px-6" style={{ backgroundColor: '#0E1F18' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <CpReveal>
            <h2
              className="cp-title text-cp-cream font-black leading-none mb-8"
              style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
            >
              CONTACT
            </h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  href: `tel:${ci.phone}`,
                  label: ci.phoneDisplay,
                  icon: (
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67 2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  ),
                  fill: false,
                },
                {
                  href: whatsappUrl(ci),
                  label: 'WhatsApp',
                  icon: (
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.127 1.534 5.862L.057 23.454a.5.5 0 00.492.607.49.49 0 00.135-.019l5.769-1.519A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.5-5.24-1.373l-.376-.217-3.892 1.024 1.001-3.797-.234-.388A9.96 9.96 0 012 12C2 6.478 6.477 2 12 2s10 4.478 10 10-4.477 10-10 10z" />
                  ),
                  fill: true,
                },
              ].map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  className="flex items-center gap-3 text-cp-cream/80 hover:text-cp-vert-l transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full border border-cp-vert-l/30 flex items-center justify-center text-cp-vert-l group-hover:bg-cp-vert-l/10 transition-colors">
                    <svg
                      width="16"
                      height="16"
                      fill={c.fill ? 'currentColor' : 'none'}
                      stroke={c.fill ? 'none' : 'currentColor'}
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {c.icon}
                    </svg>
                  </span>
                  {c.label}
                </a>
              ))}
              <div className="flex items-center gap-3 text-cp-cream/60">
                <span className="w-10 h-10 rounded-full border border-cp-vert-l/30 flex items-center justify-center text-cp-vert-l">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                {addressOneLine(ci)}
              </div>
            </div>
          </CpReveal>

          <CpReveal delay={1}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="cp-title text-cp-cream font-black text-2xl">HORAIRES</h3>
                <CpOpenBadge />
              </div>
              <div className="flex flex-col gap-3">
                {HORAIRES.map((h) => (
                  <div
                    key={h.jour}
                    className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-cp-cream/60 text-sm">{h.jour}</span>
                    <span
                      className={`text-sm font-medium ${h.horaire === 'Fermé' ? 'text-red-400' : 'text-cp-cream'}`}
                    >
                      {h.horaire}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/contact"
                className="mt-6 w-full inline-flex justify-center items-center gap-2 bg-cp-red text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-red-d transition-colors text-sm"
              >
                Je suis intéressé
              </Link>
            </div>
          </CpReveal>
        </div>
      </section>

      <CpBridge fromColor="#0E1F18" toColor="#1A0F06" />

      {/* ── FOOTER ──────────────────────────────── */}
      <footer id="footer-section" className="py-16 px-6" style={{ backgroundColor: '#1A0F06' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <CpLogo tone="dark" size="footer" className="mb-4" />
              <p className="text-cp-cream/40 text-sm leading-relaxed">
                Votre garage de confiance en Guadeloupe — passion, conseil technique, pièces de
                qualité.
              </p>
            </div>
            <div>
              <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">Services</p>
              <div className="flex flex-col gap-2">
                {servicesLinks.map((href) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors capitalize"
                  >
                    {href.replace('/', '').replace('-', ' ')}
                  </Link>
                ))}
              </div>
            </div>
            {flags.pieces && (
              <div>
                <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">
                  Boutique pièces
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { href: '/pieces', label: 'Catalogue' },
                    { href: '/pieces?type=auto', label: 'Auto' },
                    { href: '/pieces?type=moto', label: 'Moto' },
                    { href: '/pieces?promo=1', label: 'Promotions' },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">
                Informations
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/a-propos', label: 'À propos' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/mentions-legales', label: 'Mentions légales' },
                  { href: '/confidentialite', label: 'Confidentialité' },
                  { href: '/cgv', label: 'CGV' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-cp-cream/30 text-xs">
              © {new Date().getFullYear()} Car Performance Guadeloupe. Tous droits réservés.
            </p>
            <p className="cp-mono text-cp-cream/20 text-xs">Guadeloupe · 971</p>
          </div>
        </div>
      </footer>
    </>
  );
}
