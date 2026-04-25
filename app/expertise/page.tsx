import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { ExpertiseForm } from './ExpertiseForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Expertise automobile certifiée',
  description:
    'Expertise automobile certifiée en Guadeloupe. Achat VO, dommages, litige assurance. Rapport officiel sous 48h. À partir de 120 € TTC.',
};

const PROCESS = [
  {
    num: '01',
    title: 'Demande en ligne',
    desc: 'Remplissez le formulaire avec les infos du véhicule et vos photos. 3 minutes suffisent.',
  },
  {
    num: '02',
    title: 'Contact sous 24h',
    desc: 'Un expert certifié vous rappelle pour confirmer le rendez-vous et affiner le devis.',
  },
  {
    num: '03',
    title: 'Inspection du véhicule',
    desc: 'Contrôle complet sur site ou en atelier. Carrosserie, mécanique, électronique, historique.',
  },
  {
    num: '04',
    title: 'Rapport officiel',
    desc: 'Document certifié remis sous 48h. Valeur vénale, état général, points de vigilance.',
  },
];

const GARANTIES = [
  { label: 'Experts certifiés', desc: 'Agréés par les organismes officiels' },
  { label: 'Rapport opposable', desc: 'Document légalement reconnu' },
  { label: 'Toutes marques', desc: 'Auto et moto, toutes motorisations' },
  { label: 'Délai 48h', desc: 'Rapport remis rapidement' },
];

export default function ExpertisePage() {
  return (
    <>
      <CpHeader darkSectionIds={['exp-hero', 'exp-process', 'exp-form']} />

      {/* ── HERO ─────────────────────────────── */}
      <section
        id="exp-hero"
        className="relative pt-20 overflow-hidden"
        style={{ backgroundColor: '#0E1F18' }}
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
              <span className="text-cp-cream/60">Expertise</span>
            </nav>

            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-5">
              Experts certifiés · Guadeloupe
            </p>
            <h1
              className="cp-title font-black text-cp-cream leading-none mb-6"
              style={{ fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              EXPERTISE
              <br />
              <span className="text-cp-mango">CERTIFIÉE</span>
            </h1>
            <p className="text-cp-cream/55 text-base leading-relaxed max-w-md mb-8">
              Achat VO, dommages, litige assurance. Nos experts certifiés inspectent votre véhicule
              et rédigent un rapport officiel opposable.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-8">
              {[
                { val: '4 200+', lbl: 'Expertises réalisées' },
                { val: '16 ans', lbl: "D'expérience" },
              ].map((s) => (
                <div key={s.lbl}>
                  <p
                    className="cp-title font-black text-cp-mango"
                    style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
                  >
                    {s.val}
                  </p>
                  <p className="text-cp-cream/35 text-xs uppercase tracking-wider mt-0.5">
                    {s.lbl}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {['Rapport officiel', 'Délai 48h', 'À partir de 120 € TTC'].map((pill) => (
                <span
                  key={pill}
                  className="cp-mono text-xs text-cp-cream/50 border border-cp-cream/15 px-3 py-1.5 rounded-full"
                >
                  {pill}
                </span>
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
                  "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E1F18] via-[#0E1F18]/20 to-transparent" />
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0E1F18" toColor="#0D0905" />

      {/* ── PROCESSUS ────────────────────────── */}
      <section id="exp-process" className="py-24 px-6" style={{ backgroundColor: '#0D0905' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-4">
              Comment ça marche
            </p>
            <h2
              className="cp-title font-black text-cp-cream leading-none"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
            >
              4 ÉTAPES,
              <br />
              <span className="text-cp-mango">ZÉRO STRESS</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connector line desktop */}
            <div
              className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-cp-mango/30 to-transparent"
              aria-hidden="true"
            />

            {PROCESS.map((p) => (
              <div
                key={p.num}
                className="flex flex-col items-center text-center md:items-start md:text-left"
              >
                <div className="w-16 h-16 rounded-2xl bg-cp-mango/10 border border-cp-mango/20 flex items-center justify-center mb-4 relative z-10">
                  <span className="cp-mono font-bold text-cp-mango text-lg">{p.num}</span>
                </div>
                <h3 className="cp-title font-black text-cp-cream text-xl mb-2">{p.title}</h3>
                <p className="text-cp-cream/45 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#F4EDE0" />

      {/* ── FORMULAIRE ───────────────────────── */}
      <section className="py-24 px-6 pt-32" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Info col */}
          <div>
            <p className="cp-mono text-cp-ink/35 text-xs tracking-widest uppercase mb-4">
              Demande d&apos;expertise
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none mb-8"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
            >
              VOTRE
              <br />
              DOSSIER
              <br />
              <em className="text-cp-mango not-italic">EN LIGNE</em>
            </h2>
            <p className="text-cp-ink/60 text-base leading-relaxed mb-10 max-w-md">
              Remplissez le formulaire en 3 minutes. Ajoutez des photos du véhicule pour accélérer
              l&apos;analyse. Un expert vous rappelle sous 24h.
            </p>

            {/* Garanties */}
            <div className="grid grid-cols-2 gap-4">
              {GARANTIES.map((g) => (
                <div key={g.label} className="bg-white rounded-xl p-4 border border-[#E5DDD3]">
                  <div className="w-2 h-2 rounded-full bg-cp-mango mb-3" />
                  <p className="font-semibold text-cp-ink text-sm mb-0.5">{g.label}</p>
                  <p className="text-cp-ink/50 text-xs leading-relaxed">{g.desc}</p>
                </div>
              ))}
            </div>

            {/* Prix */}
            <div className="mt-8 bg-cp-ink rounded-2xl p-6 text-cp-cream">
              <p className="cp-mono text-xs text-cp-cream/40 uppercase tracking-widest mb-2">
                Tarif indicatif
              </p>
              <p className="cp-title font-black text-3xl mb-1">
                À partir de <span className="text-cp-mango">120 €</span>{' '}
                <span className="text-lg font-normal text-cp-cream/50">TTC</span>
              </p>
              <p className="text-cp-cream/50 text-sm">
                Devis précis fourni lors de la prise de contact selon le type d&apos;expertise.
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <ExpertiseForm />
        </div>
      </section>

      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
