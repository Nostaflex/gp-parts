import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { getCachedLavageSettings } from '@/lib/data/lavage-settings-cache';
import { getPrisEffectifs } from '@/lib/server/lavage-dispos';
import { feriesPourDates } from '@/lib/jours-feries';
import { formatPrice, localDateISO } from '@/lib/utils';
import type { PrisParDate } from '@/lib/lavage-creneaux';
import { CpBulle } from '@/components/cp/CpBulle';
import { FormulesGabarit } from './FormulesGabarit';
import { LavageForm } from './LavageForm';

// Fraîcheur des disponibilités servies au premier rendu (le client re-vérifie
// au focus, le serveur re-vérifie au submit — 60 s suffisent ici).
export const revalidate = 60;

/** Horizon du sélecteur : 14 jours à partir de demain. */
const PIT_LANE_JOURS = 14;

export const metadata: Metadata = {
  title: 'SPLASH — Esthétique automobile premium',
  description:
    'SPLASH, l’esthétique automobile premium de Car Performance en Guadeloupe : Premium Wash ou Ultimate Wash, lavage manuel intérieur et extérieur. Prenez votre créneau en ligne, réponse sous 24 h en jours ouvrés.',
  alternates: { canonical: '/lavage' },
};

export default async function LavagePage() {
  const flags = await getCachedFeatureFlags();
  if (!flags.lavage) notFound();
  const { formules } = await getCachedLavageSettings();

  // Indisponibilités EFFECTIVES (semaine type ∪ exceptions) de l'horizon en
  // UNE requête, rendues côté serveur — zéro fetch au premier affichage.
  // Fail-open : la CI prérend sans Firebase.
  const dates = Array.from({ length: PIT_LANE_JOURS }, (_, i) => localDateISO(1 + i));
  let initialPris: PrisParDate = {};
  try {
    initialPris = await getPrisEffectifs(dates);
  } catch (err) {
    console.warn('[lavage] lecture dispos échouée (fail-open, tout libre):', err);
  }
  // Fériés Guadeloupe — calcul local, zéro API (indication, pas blocage :
  // Stéphane décide d'ouvrir ou non via la semaine type / les exceptions).
  const feries = feriesPourDates(dates);

  // Demande Stéphane (mail 2026-08-14) : deux cartes larges pour les formules
  // détaillées, le forfait (tarif unique, sans liste de prestations) en
  // bandeau complémentaire SOUS les offres.
  const estBandeau = (f: (typeof formules)[number]) =>
    f.tarifs.length === 1 && f.inclus.length === 0;
  const cartes = formules.filter((f) => !estBandeau(f));
  const bandeaux = formules.filter(estBandeau);

  return (
    <>
      <CpHeader darkSectionIds={['lav-hero']} />

      {/* ── HERO — l'univers bleu de Splash (handoff cp-v4, écran 2) ── */}
      <section
        id="lav-hero"
        className="relative pt-20 overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #0E8FA6 0%, #0A5F72 52%, #062730 100%)' }}
      >
        {/* Orbe lagon — décor sous le contenu */}
        <div
          aria-hidden="true"
          className="absolute -top-24 right-[8%] w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(60,197,222,.3) 0%, transparent 68%)' }}
        />
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 min-h-[55vh] grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-10">
          <div>
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center gap-2 text-xs text-cp-cream/40 mb-8"
            >
              <Link href="/" className="hover:text-cp-cream transition-colors">
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
              <span className="text-cp-cream/70">Lavage</span>
            </nav>

            <p
              className="cp-mono text-xs tracking-widest uppercase mb-5"
              style={{ color: '#BFF0FA' }}
            >
              Splash · Esthétique automobile premium
            </p>
            <h1
              className="cp-title font-black text-cp-cream leading-none mb-6"
              style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}
            >
              VOTRE VÉHICULE
              <br />
              {/* Le rouge ne tient pas sur lagon — accent chaud #FFD9A8 (handoff). */}
              <span style={{ color: '#FFD9A8' }}>COMME NEUF</span>
            </h1>
            {/* Texte de Stéphane (mail 2026-08-14) — délai ajusté à 24 h (le
                48 h de son brouillon concerne la vente d'occasion). */}
            <p className="text-cp-cream/70 text-base leading-relaxed max-w-md mb-8">
              Prenez soin de votre véhicule jusque dans les détails. SPLASH associe lavage manuel,
              nettoyage intérieur et soins esthétiques dans deux formules simples, adaptées au type
              de véhicule. Choisissez votre formule et votre créneau — notre équipe vous confirme
              sous 24 h en jours ouvrés.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Sur rendez-vous', 'Produits professionnels', 'Intérieur & extérieur'].map(
                (pill) => (
                  <span
                    key={pill}
                    className="cp-mono text-xs text-cp-cream/70 border border-cp-cream/25 px-3 py-1.5 rounded-full"
                  >
                    {pill}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Splash en hôte : bulle TOUJOURS au-dessus, pointe vers la tête.
              Marge négative = les pieds posés sur le bord de section. */}
          <div className="flex flex-col items-center self-end mx-auto md:mx-0 -mb-16 md:-mb-20">
            <CpBulle
              nom="Splash"
              role="L'expert de l'entretien auto"
              replique="On ti splash, lave’y fè’y kléré !"
              className="max-w-[300px] mb-[22px]"
            />
            <Image
              src="/images/mascottes/splash-gant.webp"
              alt="Splash, mascotte iguane de l'esthétique automobile"
              width={560}
              height={840}
              priority
              className="h-[290px] md:h-[320px] w-auto"
            />
          </div>
        </div>
      </section>

      <CpBridge fromColor="#062730" toColor="#F4EDE0" accentColor="#3CC5DE" />

      {/* ── FORMULES ─────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          <p className="cp-mono text-cp-ink/35 text-xs tracking-widest uppercase mb-4">
            Nos formules
          </p>
          <h2
            className="cp-title font-black text-cp-ink leading-none mb-12"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
          >
            NOS FORMULES
          </h2>
          {/* Sélecteur de gabarit unique + une ligne de prix par carte
              (handoff cp-v4). Les labels viennent des données BO. */}
          <div className="mb-6">
            <FormulesGabarit formules={cartes} />
          </div>

          {/* Ce qui se passe ensuite (handoff cp-v4) — 24 h et non 48 h :
              le 48 h de la spec est une coquille, 48 h = vente d'occasion
              (clarification Djemil). */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-10 text-sm text-cp-lab-l">
            <span>Aucun paiement en ligne</span>
            <span>Tarif exact confirmé sous 24 h en jours ouvrés</span>
            <span>Créneau réservé à la confirmation</span>
          </div>

          {/* Bandeau(x) complémentaire(s) — forfaits à tarif unique */}
          <div className="flex flex-col gap-4 mb-20">
            {bandeaux.map((f) => (
              <div
                key={f.nom}
                className="bg-white rounded-2xl border border-[#E5DDD3] px-8 py-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h3 className="cp-title font-black text-cp-ink text-xl">{f.nom.toUpperCase()}</h3>
                  {f.description && (
                    <p className="text-cp-ink/55 text-sm leading-relaxed">{f.description}</p>
                  )}
                </div>
                <p className="cp-mono text-cp-mango text-lg tracking-wide">
                  {f.tarifs[0].label !== 'Forfait' && (
                    <span className="text-cp-ink/50 text-sm mr-2">{f.tarifs[0].label}</span>
                  )}
                  {formatPrice(f.tarifs[0].prixTTCEnCents)}
                  <span className="text-cp-ink/40 text-xs"> TTC</span>
                </p>
              </div>
            ))}
          </div>

          {/* ── RDV ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="cp-mono text-cp-ink/35 text-xs tracking-widest uppercase mb-4">
                Prise de rendez-vous
              </p>
              <h2
                className="cp-title font-black text-cp-ink leading-none mb-8"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
              >
                RÉSERVEZ
                <br />
                <em className="text-cp-red not-italic">VOTRE CRÉNEAU.</em>
              </h2>
              <p className="text-cp-ink/60 text-base leading-relaxed mb-8 max-w-md">
                Un rendez-vous dédié à l&apos;esthétique, distinct de l&apos;atelier : choisissez
                votre formule, le gabarit de votre véhicule, votre date et votre créneau. Notre
                équipe vous confirme sous 24 h en jours ouvrés.
              </p>
              {/* Réassurance SPLASH — visuel validé par Stéphane (référence
                  officielle, recadrée en médaillon, jamais redessinée). */}
              <div className="flex items-center gap-4 mb-10">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-cp-mango flex-shrink-0">
                  <Image
                    src="/images/splash/splash-sans-gant.png"
                    alt="Splash, la mascotte de l'esthétique automobile Car Performance"
                    fill
                    sizes="80px"
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <p className="cp-title font-black text-cp-ink text-lg leading-tight">SPLASH</p>
                  <p className="text-cp-ink/55 text-sm leading-snug">
                    L&apos;expert de l&apos;entretien auto — votre véhicule est entre de bonnes
                    mains.
                  </p>
                </div>
              </div>
            </div>
            <LavageForm
              formules={formules.map((f) => ({ nom: f.nom, tarifs: f.tarifs }))}
              dates={dates}
              initialPris={initialPris}
              feries={feries}
            />
          </div>
        </div>
      </section>

      <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
