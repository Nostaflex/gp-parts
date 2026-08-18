'use client';

// Pit Lane — parcours de réservation location en 3 étapes (handoff design
// 2026-08-17, README §4 + maquette cp-v4 « Trois choix, un ticket »).
// Fond cinéma #0D0905, accent vert location via --acc (le même composant
// pourra servir au Lavage en bleu). Le rail est cliquable dans les deux sens,
// Max narre chaque étape, le ticket recalcule et clignote à chaque choix.
// Mobile (< 700 px de CONTENEUR, pas de viewport) : le récap devient une
// barre collante en bas — styles dans globals.css (« Pit Lane »).

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import type { LocationCar } from '@/lib/location-cars';
import type { LocationSettings } from '@/lib/location-settings';
import { cautionPourVoiture } from '@/lib/location-settings';
import { LLD_SEUIL_JOURS } from '@/lib/reservations';
import { formatPrice, localDateISO } from '@/lib/utils';
import {
  PITLANE_DUREES,
  addDaysISO,
  nbJoursEntre,
  formatJourCourt,
  jaugeRemplissage,
  libelleLibres,
  maxStory,
  maxSideNote,
} from '@/lib/pitlane';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { validateReservation, checkDispo, getDispoParJour, type DispoJour } from './actions';

type PitStep = 1 | 2 | 3;

type ReservationData = {
  vehiculeId: string;
  dateDepart: string;
  dateRetour: string;
  heureDepart: string;
  heureRetour: string;
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  permis: string;
  dateNaissance: string;
  dateObtentionPermis: string;
  adresseRue: string;
  adresseCodePostal: string;
  adresseVille: string;
  consent: boolean;
  cgl: boolean;
};

// Créneaux de prise/restitution (heure collectée, prix au jour — décision 2026-07-31)
const HEURES = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

const fld =
  'w-full rounded-xl border border-[rgba(244,237,224,0.14)] bg-[rgba(244,237,224,0.05)] px-3.5 py-2.5 text-sm text-cp-cream placeholder:text-cp-cream/25 outline-none transition-colors focus:border-[var(--acc)] [color-scheme:dark]';
const lbl = 'cp-mono block text-[0.6rem] uppercase tracking-[0.16em] text-[var(--lab-d)] mb-1.5';

export function PitLaneBooking({
  cars,
  settings,
  initialVehiculeId,
  initialDateDepart,
  initialDateRetour,
  onClose,
  onDevisLLD,
}: {
  cars: LocationCar[];
  settings: LocationSettings;
  initialVehiculeId: string;
  initialDateDepart?: string;
  initialDateRetour?: string;
  onClose: () => void;
  onDevisLLD: () => void;
}) {
  const [step, setStep] = useState<PitStep>(1);
  const [maxStepReached, setMaxStepReached] = useState<PitStep>(1);
  const [dureeJours, setDureeJours] = useState<number | null>(null);
  const [modePrecis, setModePrecis] = useState(
    // Dates déjà saisies dans la recherche → on les respecte telles quelles.
    Boolean(initialDateDepart && initialDateRetour)
  );
  const [dispoJours, setDispoJours] = useState<DispoJour[] | null>(null);
  const [dispoFailed, setDispoFailed] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot anti-spam
  const [done, setDone] = useState(false);
  const [reference, setReference] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationData | '_form', string>>>(
    {}
  );
  const [formData, setFormData] = useState<ReservationData>({
    vehiculeId: initialVehiculeId,
    dateDepart: initialDateDepart ?? '',
    dateRetour: initialDateRetour ?? '',
    heureDepart: '09:00',
    heureRetour: '17:00',
    prenom: '',
    nom: '',
    email: '',
    tel: '',
    permis: '',
    dateNaissance: '',
    dateObtentionPermis: '',
    adresseRue: '',
    adresseCodePostal: '',
    adresseVille: '',
    consent: false,
    cgl: false,
  });

  // Bande de 6 jours : une lecture au montage. Échec = état NOMMÉ (jamais
  // une bande muette) + bascule sur les dates précises.
  useEffect(() => {
    let cancelled = false;
    getDispoParJour(localDateISO(1))
      .then((jours) => {
        if (cancelled) return;
        if (jours.length === 0) {
          setDispoFailed(true);
          setModePrecis(true);
        } else {
          setDispoJours(jours);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDispoFailed(true);
          setModePrecis(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const car = cars.find((c) => c.id === formData.vehiculeId);
  const nbJours = nbJoursEntre(formData.dateDepart, formData.dateRetour);
  const prixConnu = Boolean(car && car.prixJourEnCents > 0);
  const totalEnCents = prixConnu && car ? car.prixJourEnCents * nbJours : 0;
  const cautionEnCents = car ? cautionPourVoiture(settings, car) : 0;

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
  }, [totalEnCents]);

  const setForm = useCallback(<K extends keyof ReservationData>(k: K, v: ReservationData[K]) => {
    setFormData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, _form: undefined }));
  }, []);

  const choisirJour = (jour: string) => {
    setForm('dateDepart', jour);
    if (dureeJours) setForm('dateRetour', addDaysISO(jour, dureeJours));
  };

  const choisirDuree = (jours: number) => {
    setDureeJours(jours);
    if (formData.dateDepart) setForm('dateRetour', addDaysISO(formData.dateDepart, jours));
  };

  const libresJourChoisi = dispoJours?.find((j) => j.jour === formData.dateDepart)?.libres;

  const story = maxStory({
    step,
    libresJourChoisi,
    jourChoisi: formData.dateDepart || undefined,
    dureeJours: nbJours || undefined,
  });
  const sideNote = maxSideNote({ categorie: car?.categorie, dureeJours: nbJours || undefined });

  const validateStep = (s: PitStep): boolean => {
    const errs: typeof errors = {};
    if (s === 1 && !formData.vehiculeId) errs._form = 'Choisissez un véhicule.';
    if (s === 2) {
      if (!formData.dateDepart) errs.dateDepart = 'Choisissez un jour de départ';
      if (!formData.dateRetour) errs.dateRetour = 'Choisissez une durée ou une date de retour';
      else if (nbJours <= 0) errs.dateRetour = 'Date de retour invalide';
      else if (nbJours >= LLD_SEUIL_JOURS)
        errs.dateRetour = `Au-delà de ${LLD_SEUIL_JOURS - 1} jours, demandez un devis longue durée.`;
    }
    if (s === 3) {
      if (!formData.prenom.trim()) errs.prenom = 'Prénom requis';
      if (!formData.nom.trim()) errs.nom = 'Nom requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email invalide';
      if (!/^[0-9\s\+]{8,}$/.test(formData.tel)) errs.tel = 'Numéro invalide';
      if (!formData.permis.trim()) errs.permis = 'N° de permis requis';
      if (!formData.dateNaissance) errs.dateNaissance = 'Date de naissance requise';
      if (!formData.dateObtentionPermis) errs.dateObtentionPermis = 'Date d’obtention requise';
      if (!formData.adresseRue.trim()) errs.adresseRue = 'Adresse requise';
      if (!/^[0-9A-Za-z\s-]{4,10}$/.test(formData.adresseCodePostal))
        errs.adresseCodePostal = 'Code postal requis';
      if (!formData.adresseVille.trim()) errs.adresseVille = 'Ville requise';
      if (!formData.cgl) errs.cgl = 'Acceptation des conditions de location requise';
      if (!formData.consent) errs.consent = 'Consentement requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goTo = (target: PitStep) => {
    // Rail cliquable dans les deux sens ; en avant, chaque étape se valide.
    if (target <= step) {
      setStep(target);
      return;
    }
    if (target > maxStepReached + 1) return;
    if (!validateStep(step)) return;
    setStep(target);
    setMaxStepReached((m) => (target > m ? target : m));
  };

  const next = async () => {
    if (!validateStep(step)) return;
    if (step === 2) {
      // Vérif dispo du véhicule choisi sur la plage (garde finale serveur).
      const { unavailableIds } = await checkDispo(formData.dateDepart, formData.dateRetour);
      if (unavailableIds.includes(formData.vehiculeId)) {
        setErrors({ dateRetour: 'Ce véhicule est déjà réservé sur ces dates.' });
        return;
      }
    }
    if (step === 3) {
      if (sending) return;
      setSending(true);
      const result = await validateReservation({
        locationCarId: formData.vehiculeId,
        dateDepart: formData.dateDepart,
        dateRetour: formData.dateRetour,
        heureDepart: formData.heureDepart,
        heureRetour: formData.heureRetour,
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        telephone: formData.tel,
        permis: formData.permis,
        dateNaissance: formData.dateNaissance,
        dateObtentionPermis: formData.dateObtentionPermis,
        adresseRue: formData.adresseRue,
        adresseCodePostal: formData.adresseCodePostal,
        adresseVille: formData.adresseVille,
        consent: formData.consent,
        cgl: formData.cgl,
        website,
      });
      setSending(false);
      if (!result.success) {
        setErrors(result.errors as Partial<Record<keyof ReservationData | '_form', string>>);
        return;
      }
      setReference(result.reference!);
      setDone(true);
      return;
    }
    const target = (step + 1) as PitStep;
    setStep(target);
    setMaxStepReached((m) => (target > m ? target : m));
  };

  const err = (k: keyof ReservationData) =>
    errors[k] ? <p className="mt-1 text-[0.75rem] text-[#FF8A80]">{errors[k]}</p> : null;

  // ── Écran de confirmation ────────────────────────────────────────────────
  if (done && car) {
    return (
      <section className="px-6 py-24" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#52C88A]/25 bg-[#52C88A]/10">
            <CheckCircle className="text-[#2A5C45]" size={36} strokeWidth={1.5} />
          </div>
          <p className="cp-mono mb-3 text-xs uppercase tracking-widest text-cp-mango">
            Réservation enregistrée
          </p>
          <h2
            className="cp-title mb-4 font-black leading-none text-cp-ink"
            style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)' }}
          >
            VOTRE VÉHICULE
            <br />
            <em className="not-italic text-cp-mango">EST RÉSERVÉ</em>
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-cp-ink/55">
            Votre réservation a bien été enregistrée. Nous vous contactons sous 2 h pour confirmer
            les modalités de remise.
          </p>
          <div className="mb-6 rounded-2xl border border-[#E5DDD3] bg-white p-6 text-left shadow-sm">
            <p className="cp-mono mb-4 text-xs uppercase tracking-wider text-[#C8A040]">
              Récapitulatif
            </p>
            {[
              { k: 'Référence', v: reference },
              { k: 'Véhicule', v: `${car.marque} ${car.modele}` },
              {
                k: 'Départ',
                v: `${formatJourCourt(formData.dateDepart)} · ${formData.heureDepart}`,
              },
              {
                k: 'Retour',
                v: `${formatJourCourt(formData.dateRetour)} · ${formData.heureRetour}`,
              },
              { k: 'Durée', v: `${nbJours} jour${nbJours > 1 ? 's' : ''}` },
              { k: 'Total TTC', v: prixConnu ? formatPrice(totalEnCents) : 'Sur devis' },
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
            Un email de confirmation a été envoyé à <strong>{formData.email}</strong>
          </p>
          <button onClick={onClose} className="cp-tap text-sm text-cp-mango hover:underline">
            Faire une nouvelle réservation
          </button>
        </div>
      </section>
    );
  }

  // ── Parcours 3 étapes ────────────────────────────────────────────────────
  return (
    <section
      id="pitlane"
      className="cp-pl px-0 pb-0 pt-14"
      style={
        {
          backgroundColor: '#0D0905',
          '--acc': '#52C88A',
          '--acc-ink': '#06231A',
        } as React.CSSProperties
      }
    >
      <div className="cp-pl-wrap mx-auto max-w-6xl">
        {/* En-tête + rail */}
        <div className="px-6 md:px-8">
          <div className="mb-5 flex flex-wrap items-end gap-4">
            <div>
              <p className="cp-mono mb-2 text-xs uppercase tracking-widest text-[var(--acc)]">
                Pit Lane · Location
              </p>
              <h2
                className="cp-title font-black uppercase leading-none text-cp-cream"
                style={{ fontSize: 'clamp(1.8rem,3.2vw,2.6rem)' }}
              >
                Trois choix, un ticket
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cp-tap cp-mono ml-auto self-center text-[0.62rem] uppercase tracking-[0.12em] text-cp-cream/35 transition-colors hover:text-cp-cream/70"
            >
              ← Retour au catalogue
            </button>
          </div>

          <div className="cp-pl-rail" role="group" aria-label="Étapes de la réservation">
            {(
              [
                { n: 1 as PitStep, label: 'Le véhicule' },
                { n: 2 as PitStep, label: 'Les dates' },
                { n: 3 as PitStep, label: 'Le retrait' },
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
          <div className="cp-pl-stage">
            {/* Narration de Max — change par étape ET par choix */}
            <div className="cp-pl-story">
              <span className="cp-pl-ava">
                <Image src="/images/mascottes/max.webp" alt="" width={52} height={52} />
              </span>
              <div>
                <b className="cp-mono block text-[0.58rem] font-normal uppercase tracking-[0.16em] text-[var(--acc)]">
                  {story.label}
                </b>
                <span className="text-[0.86rem] leading-[1.45] text-cp-cream/80">{story.text}</span>
              </div>
            </div>

            {/* Étape 1 — Le véhicule */}
            {step === 1 && (
              <div className="cp-pl-pane">
                <p className={lbl}>Choisissez votre véhicule</p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {cars.map((v) => {
                    const off = !v.disponible;
                    const on = v.id === formData.vehiculeId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={off}
                        aria-pressed={on}
                        onClick={() => setForm('vehiculeId', v.id)}
                        className={`cp-pl-opt cp-tap${on ? ' on' : ''}${off ? ' off' : ''}`}
                      >
                        <i aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-[0.88rem] font-semibold text-cp-cream">
                            {v.marque} {v.modele}
                          </span>
                          <small className="cp-mono block text-[0.6rem] font-normal text-cp-cream/45">
                            {off
                              ? 'Indisponible en ce moment'
                              : `${v.carburant} · ${v.transmission} · ${v.places} places`}
                          </small>
                        </span>
                        <span className="cp-mono ml-auto shrink-0 text-right text-[0.78rem] text-[var(--acc)]">
                          {v.prixJourEnCents > 0 ? (
                            <>
                              {formatPrice(v.prixJourEnCents)}
                              <s className="block text-[0.56rem] text-cp-cream/35 no-underline">
                                / jour
                              </s>
                            </>
                          ) : (
                            'Sur devis'
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Étape 2 — Les dates */}
            {step === 2 && (
              <div className="cp-pl-pane">
                {!modePrecis && dispoJours && (
                  <>
                    <p className={lbl}>Jour de départ</p>
                    <div className="cp-pl-days">
                      {dispoJours.map((j) => {
                        const jauge = jaugeRemplissage(j.libres, j.total);
                        const complet = j.libres <= 0;
                        const on = formData.dateDepart === j.jour;
                        const [wd, num] = formatJourCourt(j.jour).split(' ');
                        return (
                          <button
                            key={j.jour}
                            type="button"
                            disabled={complet}
                            aria-pressed={on}
                            onClick={() => choisirJour(j.jour)}
                            className={`cp-pl-dd cp-tap${on ? ' on' : ''}${complet ? ' full' : ''}`}
                          >
                            <span className="cp-mono block text-[0.56rem] uppercase tracking-[0.14em] opacity-55">
                              {wd}
                            </span>
                            <span className="cp-title block text-[1.4rem] font-black leading-[1.1]">
                              {num}
                            </span>
                            <span className="cp-pl-g" aria-hidden="true">
                              <i style={{ width: `${jauge.pct}%`, background: jauge.couleur }} />
                            </span>
                            <span className="cp-mono mt-1 block text-[0.52rem] opacity-60">
                              {libelleLibres(j.libres)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {err('dateDepart')}

                    <p className={`${lbl} mt-5`}>Durée</p>
                    <div className="cp-pl-durs">
                      {PITLANE_DUREES.map((d) => (
                        <button
                          key={d.jours}
                          type="button"
                          aria-pressed={dureeJours === d.jours}
                          onClick={() => choisirDuree(d.jours)}
                          className={`cp-pl-du cp-tap${dureeJours === d.jours ? ' on' : ''}`}
                        >
                          <b className="cp-title block text-[1.3rem] font-black leading-none">
                            {d.jours} j
                          </b>
                          <span className="cp-mono text-[0.56rem] opacity-70">{d.libelle}</span>
                        </button>
                      ))}
                    </div>
                    {err('dateRetour')}

                    <div className="cp-pl-legend" aria-hidden="true">
                      <span>
                        <i style={{ background: '#52C88A' }} />
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

                    <button
                      type="button"
                      onClick={() => setModePrecis(true)}
                      className="cp-tap cp-mono mt-4 text-[0.62rem] uppercase tracking-[0.12em] text-cp-cream/40 underline-offset-4 transition-colors hover:text-cp-cream/70 hover:underline"
                    >
                      Autres dates (départ plus lointain, longue durée…)
                    </button>
                  </>
                )}

                {modePrecis && (
                  <>
                    {dispoFailed && (
                      <p className="cp-mono mb-4 text-[0.62rem] uppercase tracking-[0.1em] text-cp-cream/45">
                        Disponibilités du parc momentanément indisponibles — choisissez vos dates,
                        nous confirmons à la réservation.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="pl-depart" className={lbl}>
                          Départ *
                        </label>
                        <input
                          id="pl-depart"
                          type="date"
                          className={fld}
                          min={localDateISO(1)}
                          value={formData.dateDepart}
                          onChange={(e) => setForm('dateDepart', e.target.value)}
                        />
                        {err('dateDepart')}
                      </div>
                      <div>
                        <label htmlFor="pl-retour" className={lbl}>
                          Retour *
                        </label>
                        <input
                          id="pl-retour"
                          type="date"
                          className={fld}
                          min={formData.dateDepart || localDateISO(2)}
                          value={formData.dateRetour}
                          onChange={(e) => setForm('dateRetour', e.target.value)}
                        />
                        {err('dateRetour')}
                      </div>
                    </div>
                    {nbJours >= LLD_SEUIL_JOURS && (
                      <div className="mt-4 rounded-xl border border-[#E9C46A]/40 bg-[rgba(244,237,224,0.05)] p-4">
                        <p className="mb-1 text-sm font-semibold text-cp-cream">
                          Location longue durée ({nbJours} jours)
                        </p>
                        <p className="mb-3 text-xs leading-relaxed text-cp-cream/55">
                          Au-delà de {LLD_SEUIL_JOURS - 1} jours, nous établissons un devis
                          personnalisé (tarif dégressif, contrat adapté). Réponse sous 48 h.
                        </p>
                        <button
                          type="button"
                          onClick={onDevisLLD}
                          className="cp-tap rounded-xl bg-cp-cream px-4 py-2 text-sm font-semibold text-cp-ink transition-colors hover:bg-white"
                        >
                          Demander un devis longue durée
                        </button>
                      </div>
                    )}
                    {!dispoFailed && (
                      <button
                        type="button"
                        onClick={() => setModePrecis(false)}
                        className="cp-tap cp-mono mt-4 text-[0.62rem] uppercase tracking-[0.12em] text-cp-cream/40 underline-offset-4 transition-colors hover:text-cp-cream/70 hover:underline"
                      >
                        ← Revenir à la semaine
                      </button>
                    )}
                  </>
                )}

                {!modePrecis && !dispoJours && !dispoFailed && (
                  <p className="cp-mono text-[0.62rem] uppercase tracking-[0.1em] text-cp-cream/45">
                    Lecture des disponibilités…
                  </p>
                )}
              </div>
            )}

            {/* Étape 3 — Le retrait */}
            {step === 3 && (
              <div className="cp-pl-pane">
                <p className={lbl}>Le retrait au local — Jarry, Baie-Mahault</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pl-prenom" className={lbl}>
                      Prénom *
                    </label>
                    <input
                      id="pl-prenom"
                      className={fld}
                      type="text"
                      autoComplete="given-name"
                      placeholder="Marie"
                      value={formData.prenom}
                      onChange={(e) => setForm('prenom', e.target.value)}
                    />
                    {err('prenom')}
                  </div>
                  <div>
                    <label htmlFor="pl-nom" className={lbl}>
                      Nom *
                    </label>
                    <input
                      id="pl-nom"
                      className={fld}
                      type="text"
                      autoComplete="family-name"
                      placeholder="Dupont"
                      value={formData.nom}
                      onChange={(e) => setForm('nom', e.target.value)}
                    />
                    {err('nom')}
                  </div>
                  <div>
                    <label htmlFor="pl-email" className={lbl}>
                      Email *
                    </label>
                    <input
                      id="pl-email"
                      className={fld}
                      type="email"
                      autoComplete="email"
                      placeholder="marie.dupont@email.com"
                      value={formData.email}
                      onChange={(e) => setForm('email', e.target.value)}
                    />
                    {err('email')}
                  </div>
                  <div>
                    <label htmlFor="pl-tel" className={lbl}>
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      id="pl-tel"
                      className={fld}
                      type="tel"
                      autoComplete="tel"
                      placeholder="0690 00 00 00"
                      value={formData.tel}
                      onChange={(e) => setForm('tel', e.target.value)}
                    />
                    {err('tel')}
                  </div>
                  <div>
                    <label htmlFor="pl-naissance" className={lbl}>
                      Date de naissance *
                    </label>
                    <input
                      id="pl-naissance"
                      className={fld}
                      type="date"
                      autoComplete="bday"
                      value={formData.dateNaissance}
                      onChange={(e) => setForm('dateNaissance', e.target.value)}
                    />
                    {err('dateNaissance')}
                  </div>
                  <div>
                    <label htmlFor="pl-obtention" className={lbl}>
                      Permis — délivré le *
                    </label>
                    <input
                      id="pl-obtention"
                      className={fld}
                      type="date"
                      value={formData.dateObtentionPermis}
                      onChange={(e) => setForm('dateObtentionPermis', e.target.value)}
                    />
                    {err('dateObtentionPermis')}
                  </div>
                  <div>
                    <label htmlFor="pl-permis" className={lbl}>
                      N° de permis *
                    </label>
                    <input
                      id="pl-permis"
                      className={`${fld} cp-mono tracking-widest`}
                      type="text"
                      placeholder="12AA34567"
                      autoComplete="off"
                      value={formData.permis}
                      onChange={(e) => setForm('permis', e.target.value.toUpperCase())}
                    />
                    {err('permis')}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="pl-hdep" className={lbl}>
                        Retrait
                      </label>
                      <select
                        id="pl-hdep"
                        className={fld}
                        value={formData.heureDepart}
                        onChange={(e) => setForm('heureDepart', e.target.value)}
                      >
                        {HEURES.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pl-hret" className={lbl}>
                        Restitution
                      </label>
                      <select
                        id="pl-hret"
                        className={fld}
                        value={formData.heureRetour}
                        onChange={(e) => setForm('heureRetour', e.target.value)}
                      >
                        {HEURES.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="pl-rue" className={lbl}>
                      Adresse *
                    </label>
                    <input
                      id="pl-rue"
                      className={fld}
                      type="text"
                      autoComplete="street-address"
                      placeholder="12 rue des Alizés"
                      value={formData.adresseRue}
                      onChange={(e) => setForm('adresseRue', e.target.value)}
                    />
                    {err('adresseRue')}
                  </div>
                  <div>
                    <label htmlFor="pl-cp" className={lbl}>
                      Code postal *
                    </label>
                    <input
                      id="pl-cp"
                      className={fld}
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="97122"
                      value={formData.adresseCodePostal}
                      onChange={(e) => setForm('adresseCodePostal', e.target.value)}
                    />
                    {err('adresseCodePostal')}
                  </div>
                  <div>
                    <label htmlFor="pl-ville" className={lbl}>
                      Ville *
                    </label>
                    <input
                      id="pl-ville"
                      className={fld}
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Baie-Mahault"
                      value={formData.adresseVille}
                      onChange={(e) => setForm('adresseVille', e.target.value)}
                    />
                    {err('adresseVille')}
                  </div>
                  <div className="rounded-xl border border-[rgba(244,237,224,0.14)] bg-[rgba(244,237,224,0.05)] px-3.5 py-2.5 sm:col-span-2">
                    <span className={lbl}>Caution — empreinte CB, non débitée</span>
                    <span className="text-[0.86rem] text-cp-cream/85">
                      {cautionEnCents > 0
                        ? `${formatPrice(cautionEnCents)} · libérée le jour du retour`
                        : 'Montant confirmé à la remise des clés'}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[0.74rem] leading-[1.5] text-cp-cream/45">
                  Conditions : {settings.ageMinimum} ans minimum,{' '}
                  {settings.permisAncienneteMinAnnees} an
                  {settings.permisAncienneteMinAnnees > 1 ? 's' : ''} de permis. État des lieux
                  photo signé sur place, 15 minutes. Même niveau de carburant au retour. Original du
                  permis et pièce d&apos;identité vérifiés à la remise des clés — aucune copie
                  n&apos;est stockée en ligne.
                </p>

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
                  <div className="flex items-start gap-3">
                    <input
                      id="pl-cgl"
                      type="checkbox"
                      checked={formData.cgl}
                      onChange={(e) => setForm('cgl', e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#52C88A]"
                    />
                    <label
                      htmlFor="pl-cgl"
                      className="cursor-pointer text-xs leading-relaxed text-cp-cream/60"
                    >
                      J&apos;ai lu et j&apos;accepte les{' '}
                      <Link
                        href="/location/cgl"
                        target="_blank"
                        className="text-[var(--acc)] underline"
                      >
                        conditions générales de location
                      </Link>{' '}
                      et je confirme l&apos;exactitude des informations fournies.
                    </label>
                  </div>
                  {err('cgl')}
                  <div className="flex items-start gap-3">
                    <input
                      id="pl-consent"
                      type="checkbox"
                      checked={formData.consent}
                      onChange={(e) => setForm('consent', e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#52C88A]"
                    />
                    <label
                      htmlFor="pl-consent"
                      className="cursor-pointer text-xs leading-relaxed text-cp-cream/60"
                    >
                      J&apos;accepte que mes données soient utilisées pour traiter ma réservation
                      (conservées 12 mois, jamais transmises à des tiers).
                    </label>
                  </div>
                  {err('consent')}
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
                  Max Explorer
                </b>
                <span className="text-[0.78rem] leading-[1.4] text-cp-cream/70">{sideNote}</span>
              </span>
              <Image
                src="/images/mascottes/max-iso.webp"
                alt=""
                width={120}
                height={120}
                className="cp-pl-mascotte"
              />
            </div>

            <div className="cp-pl-tk cp-mono" aria-live="polite">
              <div className="cp-pl-tr">
                <span className="uppercase">{car ? car.modele : '—'}</span>
                <span>{car?.categorie ?? ''}</span>
              </div>
              <div className="cp-pl-tr dim">
                <span>
                  {formData.dateDepart ? formatJourCourt(formData.dateDepart) : 'départ —'}
                </span>
                <span>
                  {formData.dateRetour ? `→ ${formatJourCourt(formData.dateRetour)}` : '→ retour —'}
                </span>
              </div>
              <div className="cp-pl-tr dim">
                <span>Prix / jour</span>
                <span>{prixConnu && car ? formatPrice(car.prixJourEnCents) : 'sur devis'}</span>
              </div>
              <div className="cp-pl-tr dim">
                <span>Durée</span>
                <span>{nbJours > 0 ? `${nbJours} jour${nbJours > 1 ? 's' : ''}` : '—'}</span>
              </div>
              <div className="cp-pl-tr tt">
                <span>TOTAL TTC</span>
                <b className={flash ? 'flash' : ''}>
                  {prixConnu && nbJours > 0 ? formatPrice(totalEnCents) : '—'}
                </b>
              </div>
            </div>

            <p className="mt-3 text-[0.74rem] leading-[1.5] text-cp-cream/45">
              {cautionEnCents > 0
                ? `Caution ${formatPrice(cautionEnCents)} par empreinte CB, non débitée. `
                : ''}
              Pas de paiement en ligne : nous confirmons sur WhatsApp sous 24 h ouvrées. Annulation
              libre jusqu&apos;à 12 h avant le retrait.
            </p>

            <div className="mt-auto flex gap-2 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as PitStep)}
                  className="cp-tap flex-1 rounded-xl border border-[rgba(244,237,224,0.18)] px-4 py-3 text-sm font-semibold text-cp-cream/70 transition-colors hover:border-[rgba(244,237,224,0.4)] hover:text-cp-cream"
                >
                  Retour
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={sending}
                className="cp-tap flex-1 rounded-xl px-4 py-3 text-sm font-bold text-[var(--acc-ink)] transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--acc)' }}
              >
                {step === 3 ? (sending ? 'Envoi…' : 'Confirmer la réservation') : 'Continuer'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Barre collante mobile (< 700 px conteneur) ── */}
        <div className="cp-pl-sticky">
          <div className="min-w-0">
            <p className="cp-mono truncate text-[0.6rem] uppercase tracking-[0.1em] text-cp-cream/55">
              {car ? car.modele : 'Véhicule —'}
              {nbJours > 0 ? ` · ${nbJours} j` : ''}
            </p>
            <p className="cp-title text-lg font-black leading-none text-cp-mango">
              {prixConnu && nbJours > 0 ? formatPrice(totalEnCents) : '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={next}
            disabled={sending}
            className="cp-tap shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-[var(--acc-ink)] disabled:opacity-60"
            style={{ background: 'var(--acc)' }}
          >
            {step === 3 ? (sending ? 'Envoi…' : 'Confirmer') : 'Continuer'}
          </button>
        </div>
      </div>
    </section>
  );
}
