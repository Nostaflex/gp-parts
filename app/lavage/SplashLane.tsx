'use client';

// Splash Lane — le Pit Lane de l'esthétique (maquette cp-v4-univers-standalone
// §2 : « même composant, accent bleu »). Trois étapes sur fond cinéma #0D0905,
// accent lagon via --acc : 1 La formule · 2 Le créneau · 3 Les coordonnées.
// Splash narre chaque étape, le ticket recalcule et clignote à chaque choix.
// Mobile (< 700 px de CONTENEUR) : récap masqué, barre collante en bas —
// styles partagés avec la location dans globals.css (« Pit Lane »).

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { CpMarketingOptIn } from '@/components/cp/CpMarketingOptIn';
import { CpBridge } from '@/components/cp/CpBridge';
import { formatPrice } from '@/lib/utils';
import { CRENEAUX_LAVAGE, prochainCreneau } from '@/lib/lavage-creneaux';
import { formatJourCourt, jaugeRemplissage, libelleLibres } from '@/lib/pitlane';
import { splashStory, splashSideNote, gabaritsDisponibles } from '@/lib/splash-lane';
import { submitLavage } from './actions';

import type { PrisParDate } from '@/lib/lavage-creneaux';
import type { LavageNarration, LavageTarif } from '@/lib/lavage-settings';

type SplashStep = 1 | 2 | 3;

type FormData = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  marque: string;
  modele: string;
  formule: string;
  gabarit: string;
  date: string;
  creneau: string;
  message: string;
};

export type SplashLaneFormule = { nom: string; tarifs: LavageTarif[] };

// Libellés de jour — T12:00 neutralise le fuseau sur la conversion.
const JOUR_COURT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const JOUR_LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const JOUR_TICKET = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const midi = (date: string) => new Date(`${date}T12:00:00`);

const EMPTY: FormData = {
  prenom: '',
  nom: '',
  email: '',
  tel: '',
  marque: '',
  modele: '',
  formule: '',
  gabarit: '',
  date: '',
  creneau: '',
  message: '',
};

// Jauge bleue de l'univers Splash : le lagon respire, la mangue se remplit,
// le rouge est complet (légende maquette lavage).
const JAUGE_BLEUE = (libres: number, total: number) => {
  const j = jaugeRemplissage(libres, total);
  return j.couleur === '#52C88A' ? { ...j, couleur: '#3CC5DE' } : j;
};

const fld =
  'w-full rounded-xl border border-[rgba(244,237,224,0.14)] bg-[rgba(244,237,224,0.05)] px-3.5 py-2.5 text-sm text-cp-cream placeholder:text-cp-cream/25 outline-none transition-colors focus:border-[var(--acc)] [color-scheme:dark]';
const lbl = 'cp-mono block text-[0.6rem] uppercase tracking-[0.16em] text-cp-cream/60 mb-1.5';

export function SplashLane({
  formules,
  narration,
  dates,
  initialPris,
  feries = {},
}: {
  formules: SplashLaneFormule[];
  /** Narration de Splash — administrable au BO (réglages lavage). */
  narration: LavageNarration;
  /** Horizon du sélecteur (YYYY-MM-DD, ordre chronologique). */
  dates: string[];
  /** Créneaux pris par date, rendus côté serveur — zéro fetch au premier affichage. */
  initialPris: PrisParDate;
  /** Jours fériés de l'horizon (date → libellé) — indication, pas blocage. */
  feries?: Record<string, string>;
}) {
  const [step, setStep] = useState<SplashStep>(1);
  const [maxStepReached, setMaxStepReached] = useState<SplashStep>(1);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot anti-spam
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | '_form', string>>>({});
  const [data, setData] = useState<FormData>({ ...EMPTY });

  const set = (k: keyof FormData, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, _form: undefined }));
  };

  // Créneaux pris par date. Servis par le serveur au premier rendu, rafraîchis
  // au retour d'onglet. Fail-open : si la lecture échoue, tout reste
  // sélectionnable — le serveur re-vérifie au submit.
  const [pris, setPris] = useState<PrisParDate>(initialPris);
  const prisDe = (d: string) => pris[d] ?? [];

  const refreshDispos = () => {
    fetch(`/api/lavage/disponibilites?from=${dates[0]}&to=${dates[dates.length - 1]}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { dispos?: PrisParDate } | null) => {
        if (j?.dispos) setPris(j.dispos);
      })
      .catch(() => {
        /* fail-open — le submit serveur reste la garde */
      });
  };

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshDispos();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prochain = prochainCreneau(dates, pris);

  // Tarifs de la formule choisie — plus d'un tarif → le gabarit est requis
  // (le prix en dépend : Citadine / Gamme B / SUV, gamme Stéphane 2026-08-16).
  const tarifsChoisis = formules.find((f) => f.nom === data.formule)?.tarifs ?? [];
  const tarifChoisi =
    tarifsChoisis.length === 1
      ? tarifsChoisis[0]
      : tarifsChoisis.find((t) => t.label === data.gabarit);
  // Gabarit d'abord : tant que la formule n'est pas choisie, le ticket montre
  // déjà le véhicule sélectionné.
  const gabaritAffiche = data.formule
    ? tarifsChoisis.length > 1
      ? data.gabarit || '—'
      : (tarifsChoisis[0]?.label ?? '—')
    : data.gabarit || '—';

  // Le total « clignote » à chaque changement (opacity .25 → 1, 160 ms).
  const [flash, setFlash] = useState(false);
  const firstTotal = useRef(true);
  useEffect(() => {
    if (firstTotal.current) {
      firstTotal.current = false;
      return;
    }
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 160);
    return () => clearTimeout(t);
  }, [tarifChoisi?.prixTTCEnCents]);

  const libresJourChoisi = data.date
    ? CRENEAUX_LAVAGE.length - prisDe(data.date).length
    : undefined;
  const story = splashStory(
    {
      step,
      libresJourChoisi,
      jourChoisi: data.date || undefined,
      ferieJourChoisi: data.date ? feries[data.date] : undefined,
    },
    narration
  );
  const sideNote = splashSideNote(
    {
      gabarit: data.gabarit || undefined,
      prixEnCents: tarifChoisi?.prixTTCEnCents,
    },
    narration
  );

  // Gabarits universels de l'étape 1 (gabarit d'abord — décision Djemil
  // 2026-08-20) : union des libellés des formules multi-tarifs.
  const gabarits = gabaritsDisponibles(formules);

  // Le rail RACONTE les choix : une étape passée affiche ce qui a été choisi
  // — cliquer dessus y retourne (retour 1 clic).
  const resumeEtape1 = data.formule
    ? tarifsChoisis.length > 1 && data.gabarit
      ? `${data.formule} · ${data.gabarit}`
      : data.formule
    : null;
  const resumeEtape2 =
    data.date && data.creneau
      ? `${formatJourCourt(data.date)} · ${data.creneau.slice(0, 5)}`
      : null;

  // L'étape courante est-elle complète ? → le bouton Continuer pulse pour
  // guider l'œil (pas d'avance automatique : l'utilisateur garde la main).
  const etapeComplete =
    step === 1
      ? Boolean(data.formule && (tarifsChoisis.length <= 1 || tarifChoisi))
      : step === 2
        ? Boolean(data.date && data.creneau)
        : false;

  const validateStep = (s: SplashStep): boolean => {
    const errs: typeof errors = {};
    if (s === 1) {
      if (!data.formule) errs._form = 'Choisissez une formule.';
      else if (tarifsChoisis.length > 1 && !tarifsChoisis.some((t) => t.label === data.gabarit))
        errs.gabarit = 'Choisissez votre type de véhicule';
    }
    if (s === 2) {
      if (!data.date) errs.date = 'Choisissez un jour';
      if (!data.creneau) errs.creneau = 'Choisissez un créneau';
      else if (data.date && prisDe(data.date).includes(data.creneau))
        errs.creneau = 'Ce créneau vient d’être pris — choisissez-en un autre';
    }
    if (s === 3) {
      if (!data.prenom.trim()) errs.prenom = 'Prénom requis';
      if (!data.nom.trim()) errs.nom = 'Nom requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
      if (!/^[0-9\s\+]{8,}$/.test(data.tel)) errs.tel = 'Numéro invalide';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Changer d'étape remonte la scène et y pose le focus ; une validation qui
  // échoue remonte aussi — depuis la barre collante mobile, l'erreur restait
  // hors écran (audit 2026-08-20).
  const stageRef = useRef<HTMLDivElement | null>(null);
  const revealStage = () => {
    const el = stageRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const firstStepRender = useRef(true);
  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    revealStage();
    stageRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goTo = (target: SplashStep) => {
    // Rail cliquable dans les deux sens ; en avant, chaque étape se valide.
    if (target <= step) {
      setStep(target);
      return;
    }
    if (target > maxStepReached + 1) return;
    if (!validateStep(step)) {
      revealStage();
      return;
    }
    setStep(target);
    setMaxStepReached((m) => (target > m ? target : m));
  };

  const next = async () => {
    if (!validateStep(step)) {
      revealStage();
      return;
    }
    if (step === 3) {
      if (submitting) return;
      setSubmitting(true);
      const res = await submitLavage({ ...data, marketingOptIn, website });
      setSubmitting(false);
      if (!res.ok) {
        setErrors({ _form: res.error });
        // Collision probable → re-synchroniser les disponibilités affichées.
        refreshDispos();
        revealStage();
        return;
      }
      setRef(res.ref);
      setEmailed(res.emailed);
      setDone(true);
      return;
    }
    const target = (step + 1) as SplashStep;
    setStep(target);
    setMaxStepReached((m) => (target > m ? target : m));
  };

  const choisir = (date: string, creneau: string) => {
    setData((d) => ({ ...d, date, creneau }));
    setErrors((e) => ({ ...e, date: undefined, creneau: undefined, _form: undefined }));
  };

  const err = (k: keyof FormData) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-[0.75rem] text-[#FF8A80]">
        {errors[k]}
      </p>
    ) : null;

  // ── Écran de confirmation ────────────────────────────────────────────────
  if (done) {
    return (
      <>
        <section className="px-6 py-24" style={{ backgroundColor: '#F4EDE0' }}>
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#3CC5DE]/25 bg-[#3CC5DE]/10">
              <CheckCircle className="text-cp-lagon" size={36} strokeWidth={1.5} />
            </div>
            <p className="cp-mono mb-3 text-xs uppercase tracking-widest text-cp-mango">
              Demande envoyée
            </p>
            <h2
              className="cp-title mb-4 font-black leading-none text-cp-ink"
              style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)' }}
            >
              VOTRE CRÉNEAU
              <br />
              <em className="not-italic text-cp-lagon">EST DEMANDÉ</em>
            </h2>
            <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-cp-ink/55">
              Votre demande a bien été enregistrée. Notre équipe vous confirme le créneau et le
              tarif exact sous 24 h en jours ouvrés.
            </p>
            <div className="mb-6 rounded-2xl border border-[#E5DDD3] bg-white p-6 text-left shadow-sm">
              <p className="cp-mono mb-4 text-xs uppercase tracking-wider text-[#C8A040]">
                Récapitulatif
              </p>
              {[
                { k: 'Référence', v: ref },
                { k: 'Formule', v: data.formule },
                { k: 'Véhicule', v: gabaritAffiche },
                { k: 'Jour', v: JOUR_LONG.format(midi(data.date)) },
                { k: 'Créneau', v: data.creneau },
                {
                  k: 'Estimation TTC',
                  v: tarifChoisi ? formatPrice(tarifChoisi.prixTTCEnCents) : 'Sur devis',
                },
              ].map(({ k, v }) => (
                <div
                  key={k}
                  className="flex justify-between border-b border-[#F8F5F0] py-2 last:border-0"
                >
                  <span className="text-xs text-cp-ink/50">{k}</span>
                  <span className="text-xs font-semibold text-cp-ink">{v}</span>
                </div>
              ))}
            </div>
            <p className="mb-8 text-xs text-cp-ink/40">
              {emailed ? (
                <>
                  Un email de confirmation a été envoyé à <strong>{data.email}</strong>.
                </>
              ) : (
                <>
                  Nous vous recontactons sous 24 h (jours ouvrés) au <strong>{data.tel}</strong>.
                </>
              )}
            </p>
            <button
              onClick={() => {
                setDone(false);
                setData({ ...EMPTY });
                setStep(1);
                setMaxStepReached(1);
              }}
              className="cp-tap text-sm text-cp-mango hover:underline"
            >
              Faire une nouvelle demande
            </button>
          </div>
        </section>
        <CpBridge fromColor="#F4EDE0" toColor="#1A0F06" accentColor="#3CC5DE" />
      </>
    );
  }

  // ── Parcours 3 étapes ────────────────────────────────────────────────────
  return (
    <>
      {/* Bridge astral : le crème des formules plonge dans la nuit du Pit Lane */}
      <CpBridge fromColor="#F4EDE0" toColor="#0D0905" accentColor="#3CC5DE" />
      <section
        id="splash-lane"
        className="cp-pl px-0 pb-0 pt-6"
        style={
          {
            backgroundColor: '#0D0905',
            '--acc': '#3CC5DE',
            '--acc-ink': '#04222A',
            '--acc-soft': 'rgba(60, 197, 222, 0.1)',
            '--acc-ring': 'rgba(60, 197, 222, 0.45)',
          } as React.CSSProperties
        }
      >
        <div className="cp-pl-wrap mx-auto max-w-6xl">
          {/* En-tête + rail */}
          <div className="px-6 md:px-8">
            <div className="mb-5 flex flex-wrap items-end gap-4">
              <div>
                <p className="cp-mono mb-2 text-xs uppercase tracking-widest text-[var(--acc)]">
                  Pit Lane · Splash
                </p>
                <h2
                  className="cp-title font-black uppercase leading-none text-cp-cream"
                  style={{ fontSize: 'clamp(1.8rem,3.2vw,2.6rem)' }}
                >
                  Réservez votre créneau
                </h2>
              </div>
            </div>

            <div
              className="cp-pl-rail"
              role="group"
              aria-label="Étapes de la demande de rendez-vous"
            >
              {(
                [
                  { n: 1 as SplashStep, label: resumeEtape1 ?? 'La formule' },
                  { n: 2 as SplashStep, label: resumeEtape2 ?? 'Le créneau' },
                  { n: 3 as SplashStep, label: 'Les coordonnées' },
                ] as const
              ).map(({ n, label }, i) => (
                <div key={n} className="contents">
                  {i > 0 && (
                    <span className={`cp-pl-ln${step >= n ? ' fill' : ''}`} aria-hidden="true">
                      <s />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={step === n ? 'step' : undefined}
                    className={`cp-pl-nd cp-tap${step === n ? ' cur' : step > n ? ' done' : ''}`}
                  >
                    <i>{n}</i>
                    <b>{label}</b>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="cp-pl-body">
            {/* ── Scène ── */}
            <div className="cp-pl-stage" ref={stageRef} tabIndex={-1}>
              {/* Narration de Splash — change par étape ET par choix */}
              <div className="cp-pl-story">
                <span className="cp-pl-ava cp-pl-ava-splash">
                  <Image
                    src="/images/splash/splash-sans-gant.png"
                    alt=""
                    width={52}
                    height={52}
                    className="h-full w-full object-cover object-top"
                  />
                </span>
                <div>
                  <b className="cp-mono block text-[0.58rem] font-normal uppercase tracking-[0.16em] text-[var(--acc)]">
                    {story.label}
                  </b>
                  <span className="text-[0.86rem] leading-[1.45] text-cp-cream/80">
                    {story.text}
                  </span>
                </div>
              </div>

              {/* Étape 1 — GABARIT D'ABORD (décision Djemil 2026-08-20) : une
                  question universelle (« votre véhicule ? ») puis les formules
                  affichent leur prix EXACT — jamais une fourchette. */}
              {step === 1 && (
                <div className="cp-pl-pane">
                  {gabarits.length > 0 && (
                    <>
                      <p className={lbl}>Votre véhicule</p>
                      <div
                        className="cp-pl-durs mb-5"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(gabarits.length, 4)}, 1fr)`,
                        }}
                        role="group"
                        aria-label="Choisir le type de véhicule"
                      >
                        {gabarits.map((g) => (
                          <button
                            key={g}
                            type="button"
                            aria-pressed={data.gabarit === g}
                            onClick={() => set('gabarit', g)}
                            className={`cp-pl-du cp-tap${data.gabarit === g ? ' on' : ''}`}
                          >
                            <b className="cp-title block text-[1.05rem] font-black leading-none">
                              {g}
                            </b>
                          </button>
                        ))}
                      </div>
                      {err('gabarit')}
                    </>
                  )}

                  <p className={lbl}>Votre formule</p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {formules.map((f) => {
                      const on = data.formule === f.nom;
                      const multi = f.tarifs.length > 1;
                      const tarifPourGabarit = multi
                        ? f.tarifs.find((t) => t.label === data.gabarit)
                        : f.tarifs[0];
                      // Prix exact dès que le gabarit est connu ; « dès X € »
                      // tant qu'il ne l'est pas ; « Sur devis » sans tarif.
                      const prix = tarifPourGabarit
                        ? formatPrice(tarifPourGabarit.prixTTCEnCents)
                        : multi && f.tarifs.some((t) => t.prixTTCEnCents > 0)
                          ? `dès ${formatPrice(Math.min(...f.tarifs.filter((t) => t.prixTTCEnCents > 0).map((t) => t.prixTTCEnCents)))}`
                          : 'Sur devis';
                      const sousTitre = multi
                        ? tarifPourGabarit
                          ? data.gabarit
                          : 'Choisissez votre véhicule ci-dessus'
                        : (f.tarifs[0]?.label ?? '');
                      return (
                        <button
                          key={f.nom}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            // Le gabarit est UNIVERSEL : changer de formule le
                            // conserve — le prix se recalcule simplement.
                            setData((d) => ({ ...d, formule: f.nom }));
                            setErrors((e) => ({
                              ...e,
                              formule: undefined,
                              _form: undefined,
                            }));
                          }}
                          className={`cp-pl-opt cp-tap${on ? ' on' : ''}`}
                        >
                          <i aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block text-[0.88rem] font-semibold text-cp-cream">
                              {f.nom}
                            </span>
                            <small className="cp-mono block text-[0.6rem] font-normal text-cp-cream/60">
                              {sousTitre}
                            </small>
                          </span>
                          <span className="cp-mono ml-auto shrink-0 text-right text-[0.78rem] text-[var(--acc)]">
                            {prix}
                            <s className="block text-[0.56rem] text-cp-cream/35 no-underline">
                              TTC
                            </s>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Étape 2 — Le créneau */}
              {step === 2 && (
                <div className="cp-pl-pane">
                  {/* Raccourci « Prochain créneau » (pattern Doctolib) */}
                  {prochain && (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[rgba(244,237,224,0.14)] bg-[rgba(244,237,224,0.05)] px-4 py-3">
                      <div>
                        <p className="cp-mono text-[0.6rem] uppercase tracking-[0.16em] text-cp-cream/60">
                          Prochain créneau
                        </p>
                        <p className="cp-mono text-sm text-cp-cream">
                          {JOUR_LONG.format(midi(prochain.date))} · {prochain.creneau}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => choisir(prochain.date, prochain.creneau)}
                        className="cp-tap shrink-0 text-sm font-bold text-cp-mango hover:underline"
                      >
                        Choisir →
                      </button>
                    </div>
                  )}

                  <p className={lbl}>Jour</p>
                  <div
                    className="cp-pl-lane"
                    role="group"
                    aria-label="Choisir un jour dans les deux prochaines semaines"
                  >
                    {dates.map((d) => {
                      const n = prisDe(d).length;
                      const libres = CRENEAUX_LAVAGE.length - n;
                      const complet = libres <= 0;
                      const jauge = JAUGE_BLEUE(libres, CRENEAUX_LAVAGE.length);
                      const on = data.date === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={complet}
                          aria-pressed={on}
                          title={feries[d]}
                          aria-label={`${JOUR_LONG.format(midi(d))}${feries[d] ? ` (${feries[d]})` : ''}, ${complet ? 'complet' : `${libres} créneaux libres`}`}
                          onClick={() => {
                            setData((s) => ({ ...s, date: d, creneau: '' }));
                            setErrors((e) => ({
                              ...e,
                              date: undefined,
                              creneau: undefined,
                              _form: undefined,
                            }));
                          }}
                          className={`cp-pl-dd cp-tap${on ? ' on' : ''}${complet ? ' full' : ''}`}
                        >
                          <span className="cp-mono block text-[0.56rem] uppercase tracking-[0.14em] opacity-70">
                            {JOUR_COURT.format(midi(d))}
                            {/* Férié : point mangue — l'info complète vit dans title/aria-label */}
                            {feries[d] && (
                              <span aria-hidden="true" className="ml-0.5 text-cp-mango">
                                ●
                              </span>
                            )}
                          </span>
                          <span className="cp-title block text-[1.4rem] font-black leading-[1.1]">
                            {d.slice(8)}
                          </span>
                          <span className="cp-pl-g" aria-hidden="true">
                            <i style={{ width: `${jauge.pct}%`, background: jauge.couleur }} />
                          </span>
                          <span className="cp-mono mt-1 block text-[0.52rem] opacity-75">
                            {libelleLibres(libres)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {err('date')}

                  {data.date && (
                    <>
                      <p className={`${lbl} mt-5`}>Créneau</p>
                      <div
                        className="cp-pl-durs"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
                        role="group"
                        aria-label={`Choisir un créneau le ${JOUR_LONG.format(midi(data.date))}`}
                      >
                        {CRENEAUX_LAVAGE.map((c) => {
                          const off = prisDe(data.date).includes(c);
                          const on = data.creneau === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              disabled={off}
                              aria-pressed={on}
                              aria-label={off ? `${c} — pris` : c}
                              onClick={() => set('creneau', c)}
                              className={`cp-pl-du cp-tap${on ? ' on' : ''}`}
                            >
                              <b className="cp-title block text-[1.3rem] font-black leading-none">
                                {c.slice(0, 5)}
                              </b>
                              <span className="cp-mono text-[0.56rem] opacity-70">
                                {off ? 'pris' : 'libre'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {err('creneau')}
                    </>
                  )}

                  <div className="cp-pl-legend" aria-hidden="true">
                    <span>
                      <i style={{ background: '#3CC5DE' }} />
                      ça respire
                    </span>
                    <span>
                      <i style={{ background: '#E87200' }} />
                      ça se remplit
                    </span>
                    <span>
                      <i style={{ background: '#D92627' }} />
                      complet
                    </span>
                  </div>
                </div>
              )}

              {/* Étape 3 — Les coordonnées */}
              {step === 3 && (
                <div className="cp-pl-pane">
                  <p className={lbl}>Vos coordonnées — confirmation sous 24 h en jours ouvrés</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sl-prenom" className={lbl}>
                        Prénom *
                      </label>
                      <input
                        id="sl-prenom"
                        className={fld}
                        type="text"
                        autoComplete="given-name"
                        placeholder="Marie"
                        value={data.prenom}
                        onChange={(e) => set('prenom', e.target.value)}
                      />
                      {err('prenom')}
                    </div>
                    <div>
                      <label htmlFor="sl-nom" className={lbl}>
                        Nom *
                      </label>
                      <input
                        id="sl-nom"
                        className={fld}
                        type="text"
                        autoComplete="family-name"
                        placeholder="Dupont"
                        value={data.nom}
                        onChange={(e) => set('nom', e.target.value)}
                      />
                      {err('nom')}
                    </div>
                    <div>
                      <label htmlFor="sl-email" className={lbl}>
                        Email *
                      </label>
                      <input
                        id="sl-email"
                        className={fld}
                        type="email"
                        autoComplete="email"
                        placeholder="marie.dupont@email.com"
                        value={data.email}
                        onChange={(e) => set('email', e.target.value)}
                      />
                      {err('email')}
                    </div>
                    <div>
                      <label htmlFor="sl-tel" className={lbl}>
                        Téléphone / WhatsApp *
                      </label>
                      <input
                        id="sl-tel"
                        className={fld}
                        type="tel"
                        autoComplete="tel"
                        placeholder="0690 00 00 00"
                        value={data.tel}
                        onChange={(e) => set('tel', e.target.value)}
                      />
                      {err('tel')}
                    </div>
                    <div>
                      <label htmlFor="sl-marque" className={lbl}>
                        Marque
                      </label>
                      <input
                        id="sl-marque"
                        className={fld}
                        type="text"
                        placeholder="Peugeot"
                        value={data.marque}
                        onChange={(e) => set('marque', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="sl-modele" className={lbl}>
                        Modèle
                      </label>
                      <input
                        id="sl-modele"
                        className={fld}
                        type="text"
                        placeholder="308"
                        value={data.modele}
                        onChange={(e) => set('modele', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="sl-message" className={lbl}>
                        Précisions (facultatif)
                      </label>
                      <textarea
                        id="sl-message"
                        className={`${fld} resize-none`}
                        rows={3}
                        placeholder="État du véhicule, demandes particulières…"
                        value={data.message}
                        onChange={(e) => set('message', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Honeypot anti-spam : invisible pour un humain, rempli par les bots. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      width: '1px',
                      height: '1px',
                      opacity: 0,
                    }}
                  />

                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[rgba(244,237,224,0.14)] p-4">
                    <CpMarketingOptIn
                      checked={marketingOptIn}
                      onChange={setMarketingOptIn}
                      tone="dark"
                    />
                  </div>
                  <CpRgpdNotice className="mt-4" tone="dark" />
                </div>
              )}

              {errors._form && (
                <p role="alert" className="mt-4 text-[0.8rem] text-[#FF8A80]">
                  {errors._form}
                </p>
              )}
            </div>

            {/* ── Récap (colonne desktop) ── */}
            <div className="cp-pl-side">
              <div className="cp-pl-mascard">
                <span className="max-w-[60%]">
                  <b className="cp-title block text-[0.95rem] font-black uppercase text-cp-cream">
                    Splash
                  </b>
                  <span className="text-[0.78rem] leading-[1.4] text-cp-cream/70">{sideNote}</span>
                </span>
                <Image
                  src="/images/mascottes/splash-gant.webp"
                  alt=""
                  width={120}
                  height={120}
                  className="cp-pl-mascotte"
                />
              </div>

              {/* Ticket : chaque ligne RACONTE un choix et y RAMÈNE en un clic
                  (retour 1 clic — décision Djemil 2026-08-20). */}
              <div className="cp-pl-tk cp-mono" aria-live="polite">
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  aria-label="Modifier la formule ou le véhicule (retour à l'étape 1)"
                  className="cp-pl-tr cp-pl-tr-edit"
                >
                  <span className="uppercase">{data.formule || '—'}</span>
                  <span>{gabaritAffiche}</span>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  aria-label="Modifier le jour ou le créneau (retour à l'étape 2)"
                  className="cp-pl-tr cp-pl-tr-edit dim"
                >
                  <span>{data.date ? JOUR_TICKET.format(midi(data.date)) : 'jour —'}</span>
                  <span>{data.creneau || 'créneau —'}</span>
                </button>
                <div className="cp-pl-tr tt">
                  <span>ESTIMATION TTC</span>
                  <b className={flash ? 'flash' : ''}>
                    {tarifChoisi
                      ? tarifChoisi.prixTTCEnCents > 0
                        ? formatPrice(tarifChoisi.prixTTCEnCents)
                        : 'Sur devis'
                      : '—'}
                  </b>
                </div>
              </div>

              <p className="mt-3 text-[0.74rem] leading-[1.5] text-cp-cream/60">
                Aucun paiement en ligne. Le tarif exact est confirmé sous 24 h en jours ouvrés — le
                créneau est réservé à la confirmation.
              </p>

              <div className="mt-auto flex gap-2 pt-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as SplashStep)}
                    className="cp-tap flex-1 rounded-xl border border-[rgba(244,237,224,0.18)] px-4 py-3 text-sm font-semibold text-cp-cream/70 transition-colors hover:border-[rgba(244,237,224,0.4)] hover:text-cp-cream"
                  >
                    Retour
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  disabled={submitting}
                  className={`cp-tap flex-1 rounded-xl px-4 py-3 text-sm font-bold text-[var(--acc-ink)] transition-opacity hover:opacity-90 disabled:opacity-60${etapeComplete ? ' cp-pl-pulse' : ''}`}
                  style={{ background: 'var(--acc)' }}
                >
                  {step === 3 ? (submitting ? 'Envoi…' : 'Demander ce créneau') : 'Continuer'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Barre collante mobile (< 700 px conteneur) ── */}
          <div className="cp-pl-sticky">
            <div className="min-w-0">
              <p className="cp-mono truncate text-[0.6rem] uppercase tracking-[0.1em] text-cp-cream/70">
                {data.formule || 'Formule —'}
                {data.creneau ? ` · ${data.creneau.slice(0, 5)}` : ''}
              </p>
              <p className="cp-title text-lg font-black leading-none text-cp-mango">
                {tarifChoisi
                  ? tarifChoisi.prixTTCEnCents > 0
                    ? formatPrice(tarifChoisi.prixTTCEnCents)
                    : 'Sur devis'
                  : '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={next}
              disabled={submitting}
              className={`cp-tap shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-[var(--acc-ink)] disabled:opacity-60${etapeComplete ? ' cp-pl-pulse' : ''}`}
              style={{ background: 'var(--acc)' }}
            >
              {step === 3 ? (submitting ? 'Envoi…' : 'Demander') : 'Continuer'}
            </button>
          </div>
        </div>
      </section>
      {/* Bridge de sortie : la nuit remonte vers le footer encre */}
      <CpBridge fromColor="#0D0905" toColor="#1A0F06" accentColor="#3CC5DE" />
    </>
  );
}
