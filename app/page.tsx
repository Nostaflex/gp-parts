import type { Metadata } from 'next';
import Link from 'next/link';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpReveal } from '@/components/cp/CpReveal';
import { CpOpenBadge } from '@/components/cp/CpOpenBadge';

export const metadata: Metadata = {
  title: 'Accueil',
  description:
    'Car Performance — Garage auto & moto en Guadeloupe. Réparation, expertise à distance, location et vente de véhicules.',
};

const UNIVERS = [
  {
    id: 'reparation',
    href: '/reparation',
    label: 'Réparation',
    tag: '01',
    desc: 'Mécanique, carrosserie, entretien. Devis gratuit, prise en charge rapide.',
    accent: '#E87200',
  },
  {
    id: 'expertise',
    href: '/expertise',
    label: 'Expertise',
    tag: '02',
    desc: 'Estimation à distance par photo. Recevez votre devis sans vous déplacer.',
    accent: '#E9C46A',
  },
  {
    id: 'location',
    href: '/location',
    label: 'Location',
    tag: '03',
    desc: 'Véhicules de remplacement Racoon disponibles pendant votre réparation.',
    accent: '#52C88A',
  },
  {
    id: 'vente-vo',
    href: '/vente-vo',
    label: 'Vente VO',
    tag: '04',
    desc: "Véhicules d'occasion sélectionnés, contrôlés et garantis par nos soins.",
    accent: '#2A5C45',
  },
];

const STATS = [
  { value: '15', unit: 'ans', label: "d'expérience" },
  { value: '400', unit: 'm²', label: 'de garage' },
  { value: '500+', unit: '', label: 'clients fidèles' },
  { value: '971', unit: '🏝', label: 'Guadeloupe' },
];

const TEMOIGNAGES = [
  {
    text: 'Équipe très professionnelle, mon véhicule est revenu comme neuf en 48h. Je recommande.',
    author: 'Marie-Laure B.',
    role: 'Cliente réparation',
  },
  {
    text: "J'ai envoyé mes photos le matin, j'avais un devis détaillé l'après-midi. Efficace !",
    author: 'Thierry M.',
    role: 'Client expertise à distance',
  },
  {
    text: "Le véhicule de remplacement m'a sauvé la mise. Merci pour la disponibilité.",
    author: 'Sandra K.',
    role: 'Cliente location',
  },
];

const HORAIRES = [
  { jour: 'Lundi – Vendredi', horaire: '07:30 – 17:30' },
  { jour: 'Samedi', horaire: '08:00 – 13:00' },
  { jour: 'Dimanche', horaire: 'Fermé' },
];

export default function HomePage() {
  return (
    <>
      <CpHeader darkSectionIds={['hero', 'stats', 'temoignages', 'contact', 'footer-section']} />

      {/* ── HERO ────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-dvh flex flex-col justify-center px-6 pt-24 pb-16 overflow-hidden"
        style={{ backgroundColor: '#0D0905' }}
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
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
              Garage · Guadeloupe · 971
            </p>
          </CpReveal>
          <CpReveal delay={1}>
            <h1
              className="cp-title font-black leading-none mb-8 text-cp-cream"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)' }}
            >
              CAR
              <br />
              <span className="text-cp-mango">PERFORMANCE</span>
            </h1>
          </CpReveal>
          <CpReveal delay={2}>
            <p className="text-cp-cream/60 text-lg max-w-xl mb-10 leading-relaxed">
              Réparation, expertise à distance, location et vente de véhicules. Votre garage de
              confiance en Guadeloupe.
            </p>
          </CpReveal>
          <CpReveal delay={3}>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/reparation"
                className="inline-flex items-center gap-2 bg-cp-mango text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-mango/90 transition-colors"
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
              <Link
                href="/expertise"
                className="inline-flex items-center gap-2 border border-cp-cream/30 text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-cream/10 transition-colors"
              >
                Expertise à distance
              </Link>
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
            {UNIVERS.map((u, i) => (
              <CpReveal key={u.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <Link
                  href={u.href}
                  className="group block relative rounded-2xl overflow-hidden border border-cp-ink/10 bg-white/40 hover:bg-white/70 transition-all duration-300 p-8 min-h-[200px]"
                >
                  <div className="flex items-start justify-between mb-6">
                    <span className="cp-mono text-xs text-cp-ink/30">{u.tag}</span>
                    <svg
                      className="transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{ color: u.accent }}
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="cp-title text-cp-ink font-black text-4xl leading-none mb-3">
                    {u.label.toUpperCase()}
                  </h3>
                  <p className="text-cp-ink/60 text-sm leading-relaxed max-w-xs">{u.desc}</p>
                  <div
                    className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"
                    style={{ backgroundColor: u.accent }}
                  />
                </Link>
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
                  className="cp-title text-cp-mango font-black leading-none mb-2"
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

      {/* ── TÉMOIGNAGES ─────────────────────────── */}
      <section id="temoignages" className="py-24 px-6" style={{ backgroundColor: '#1A1208' }}>
        <div className="max-w-7xl mx-auto">
          <CpReveal>
            <p className="cp-mono text-cp-gold/60 text-xs tracking-widest uppercase mb-3">
              Ils nous font confiance
            </p>
            <h2
              className="cp-title text-cp-cream font-black leading-none mb-16"
              style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
            >
              TÉMOIGNAGES
            </h2>
          </CpReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((t, i) => (
              <CpReveal key={t.author} delay={(i % 3) as 0 | 1 | 2}>
                <div className="rounded-2xl p-6 border border-white/10 bg-white/5">
                  <svg
                    className="text-cp-gold mb-4"
                    width="24"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 18"
                    aria-hidden="true"
                  >
                    <path d="M0 18V11.5C0 5.167 2.5 1.333 7.5 0L9 2.5C6.667 3.333 5.333 5 5 7.5h5V18H0Zm13 0V11.5C13 5.167 15.5 1.333 20.5 0L22 2.5C19.667 3.333 18.333 5 18 7.5h5V18H13Z" />
                  </svg>
                  <p className="text-cp-cream/80 text-sm leading-relaxed mb-4">{t.text}</p>
                  <p className="text-cp-cream font-semibold text-sm">{t.author}</p>
                  <p className="text-cp-cream/40 text-xs">{t.role}</p>
                </div>
              </CpReveal>
            ))}
          </div>
        </div>
      </section>

      <CpBridge fromColor="#1A1208" toColor="#0E1F18" />

      {/* ── CONTACT + HORAIRES ──────────────────── */}
      <section id="contact" className="py-24 px-6" style={{ backgroundColor: '#0E1F18' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <CpReveal>
            <p className="cp-mono text-cp-vert-l/60 text-xs tracking-widest uppercase mb-3">
              Nous trouver
            </p>
            <h2
              className="cp-title text-cp-cream font-black leading-none mb-8"
              style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
            >
              CONTACT
            </h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  href: 'tel:+590590000000',
                  label: '+590 590 00 00 00',
                  icon: (
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67 2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  ),
                  fill: false,
                },
                {
                  href: 'https://wa.me/590590000000',
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
                Zone industrielle de Jarry, Guadeloupe
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
                className="mt-6 w-full inline-flex justify-center items-center gap-2 bg-cp-mango text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-mango/90 transition-colors text-sm"
              >
                Nous contacter
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
              <p className="cp-title text-cp-cream font-black text-2xl mb-3">
                CAR<span className="text-cp-mango">PERF.</span>
              </p>
              <p className="text-cp-cream/40 text-sm leading-relaxed">
                Votre garage de confiance en Guadeloupe depuis 2010.
              </p>
            </div>
            <div>
              <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">Services</p>
              <div className="flex flex-col gap-2">
                {['/reparation', '/expertise', '/location', '/vente-vo'].map((href) => (
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
            <p className="cp-mono text-cp-cream/20 text-xs">971 🏝</p>
          </div>
        </div>
      </footer>
    </>
  );
}
