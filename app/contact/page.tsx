import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { ContactForm } from './ContactForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez Car Performance Guadeloupe. Réponse sous 24h. Réparation, expertise, location, vente VO — notre équipe est à votre écoute.',
};

const HORAIRES = [
  { jour: 'Lundi', time: '07h30 – 17h30' },
  { jour: 'Mardi', time: '07h30 – 17h30' },
  { jour: 'Mercredi', time: '07h30 – 17h30' },
  { jour: 'Jeudi', time: '07h30 – 17h30' },
  { jour: 'Vendredi', time: '07h30 – 17h30' },
  { jour: 'Samedi', time: '08h00 – 13h00' },
  { jour: 'Dimanche', time: null },
];

function getTodayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function ContactPage() {
  const todayIdx = getTodayIndex();

  return (
    <>
      <CpHeader darkSectionIds={['contact-hero', 'contact-main']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="contact-hero"
        className="relative pt-20 min-h-[45vh] flex items-end overflow-hidden"
        style={{ backgroundColor: '#0E1F18' }}
      >
        {/* Orbs */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '500px',
            height: '500px',
            top: '50%',
            left: '60%',
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(82,200,138,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '300px',
            height: '300px',
            top: '70%',
            left: '20%',
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(82,200,138,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 pb-16 relative z-10 w-full">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-xs text-cp-cream/30 mb-8"
          >
            <Link href="/" className="hover:text-cp-vert-l transition-colors">
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
            <span className="text-cp-cream/60">Contact</span>
          </nav>
          <p className="cp-mono text-cp-vert-l text-xs tracking-widest uppercase mb-4">
            Car Performance · Guadeloupe · 971
          </p>
          <h1
            className="cp-title font-black text-cp-cream leading-none"
            style={{ fontSize: 'clamp(3rem, 7vw, 7rem)' }}
          >
            ON EST
            <br />
            <em className="text-cp-vert-l not-italic">À L&apos;ÉCOUTE</em>
          </h1>
          <p className="text-cp-cream/45 text-base leading-relaxed max-w-md mt-4">
            Une question, un devis, un renseignement — notre équipe vous répond dans la journée.
          </p>
        </div>
      </section>

      <CpBridge fromColor="#0E1F18" toColor="#0E1F18" />

      {/* ── MAIN ─────────────────────────────── */}
      <section id="contact-main" className="py-24 px-6" style={{ backgroundColor: '#0E1F18' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Formulaire */}
          <ContactForm />

          {/* Infos */}
          <div className="flex flex-col gap-6">
            {/* Carte map placeholder */}
            <div className="bg-cp-vert/30 border border-cp-vert-l/15 rounded-2xl overflow-hidden h-48 relative flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-cp-mango flex items-center justify-center mx-auto mb-3">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <p className="text-xs text-cp-cream/50 mb-2">ZI de Jarry, Pointe-à-Pitre</p>
                <a
                  href="https://maps.google.com/?q=Car+Performance+Guadeloupe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cp-vert-l font-semibold hover:underline"
                >
                  Ouvrir dans Google Maps →
                </a>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="bg-white/5 border border-cp-cream/8 rounded-2xl p-5 flex flex-col gap-4">
              {[
                {
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  ),
                  label: 'Adresse',
                  val: 'ZI de Jarry, 97122 Baie-Mahault, Guadeloupe',
                },
                {
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3-8.59A2 2 0 012.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-.83a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  ),
                  label: 'Téléphone',
                  val: '0590 00 00 00',
                },
                {
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  ),
                  label: 'Email',
                  val: 'contact@car-performance.gp',
                },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-cp-vert-l/10 flex items-center justify-center text-cp-vert-l flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="cp-mono text-[0.6rem] text-cp-vert-l/50 uppercase tracking-wider mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-sm text-cp-cream/70">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Horaires */}
            <div className="bg-white/5 border border-cp-cream/8 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-cp-cream/8 flex items-center justify-between">
                <p className="text-sm font-semibold text-cp-cream">Horaires d&apos;ouverture</p>
                <span
                  className={`cp-mono text-[0.6rem] px-2.5 py-1 rounded-full font-semibold ${HORAIRES[todayIdx]?.time ? 'bg-cp-vert-l/15 text-cp-vert-l' : 'bg-red-500/15 text-red-400'}`}
                >
                  {HORAIRES[todayIdx]?.time ? 'Ouvert' : 'Fermé'}
                </span>
              </div>
              <div className="divide-y divide-cp-cream/5">
                {HORAIRES.map((h, i) => (
                  <div
                    key={h.jour}
                    className={`flex justify-between items-center px-5 py-2.5 ${i === todayIdx ? 'bg-cp-vert-l/5' : ''}`}
                  >
                    <span
                      className={`text-sm ${i === todayIdx ? 'text-cp-vert-l font-semibold' : 'text-cp-cream/45'}`}
                    >
                      {h.jour}
                    </span>
                    <span
                      className={`cp-mono text-xs ${i === todayIdx ? 'text-cp-vert-l' : h.time ? 'text-cp-cream/60' : 'text-cp-cream/20'}`}
                    >
                      {h.time ?? 'Fermé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0E1F18" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
