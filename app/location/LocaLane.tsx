'use client';

// Loca Lane — « le planning d'abord » (spec gelée
// docs/architecture/2026-08-20-loca-lane.md). Trois actes sur fond cinéma :
// 1 Les dates (calendrier fenêtre 6 semaines depuis demain, champs
// Départ/Retour pattern Air France/Sixt, vœu-calendrier, carrefour du vœu,
// plage morte narrée, heures en pastilles) · 2 Le véhicule (prix TOTAL de la
// plage, indispo visibles « libre le X » + bascule 1 tap) · 3 Le conducteur.
// Max narre (administrable au BO Paramètres) et quand il propose, ses
// propositions sont des boutons sous sa réplique (spec R12).
// Remplace PitLaneBooking (ordre véhicule→dates inversé, spec R1/R15).

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import type { LocationCar } from '@/lib/location-cars';
import type { LocationSettings } from '@/lib/location-settings';
import { cautionPourVoiture } from '@/lib/location-settings';
import { LLD_SEUIL_JOURS } from '@/lib/reservations';
import { formatPrice, localDateISO } from '@/lib/utils';
import { addDaysISO, nbJoursEntre, formatJourCourt } from '@/lib/pitlane';
import {
  fenetreJours,
  vehiculeLibre,
  libresLeJour,
  libreLe,
  premierDepartPossible,
  meilleureAlternative,
  jaugeJour,
  maxRecit,
  maxNote,
  type PlageOccupee,
} from '@/lib/loca-lane';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { CpMarketingOptIn } from '@/components/cp/CpMarketingOptIn';
import { CpBridge } from '@/components/cp/CpBridge';
import { validateReservation, getBusyRanges } from './actions';

type Acte = 1 | 2 | 3;
type Editing = 'start' | 'end' | null;

type ConducteurData = {
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

// Heures de retrait/restitution (spec R8 — pastilles, zéro dropdown).
const HEURES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
const FENETRE_JOURS = 42; // 6 semaines visibles (spec R4)
const HORIZON_JOURS = 365; // 1 an max depuis aujourd'hui (spec R4)
const PAS_NAVIGATION = 28; // ‹ › = 4 semaines

const JOURS_TETE = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const WD_COURT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const MOIS_COURT = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const MOIS_LONG = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const midi = (iso: string) => new Date(`${iso}T12:00:00`);

const fld =
  'w-full rounded-xl border border-[rgba(244,237,224,0.14)] bg-[rgba(244,237,224,0.05)] px-3.5 py-2.5 text-sm text-cp-cream placeholder:text-cp-cream/25 outline-none transition-colors focus:border-[var(--acc)] [color-scheme:dark]';
const lbl = 'cp-mono block text-[0.6rem] uppercase tracking-[0.16em] text-cp-cream/60 mb-1.5';

export function LocaLane({
  cars,
  settings,
  initialBusy,
  wishId,
  onClearWish,
  initialDateDepart,
  initialDateRetour,
  onDevisLLD,
}: {
  cars: LocationCar[];
  settings: LocationSettings;
  /** Plages bloquantes SSR (sans PII) — tout se calcule client ensuite. */
  initialBusy: PlageOccupee[];
  /** Vœu épinglé depuis le catalogue (spec R2) — null = pas de vœu. */
  wishId: string | null;
  onClearWish: () => void;
  initialDateDepart?: string;
  initialDateRetour?: string;
  onDevisLLD: () => void;
}) {
  const narration = settings.narration;
  const demain = localDateISO(1);

  const [acte, setActe] = useState<Acte>(1);
  const [acteMax, setActeMax] = useState<Acte>(1);
  const [off, setOff] = useState(0); // décalage de la fenêtre (jours)
  const [dateDepart, setDateDepart] = useState(initialDateDepart ?? '');
  const [dateRetour, setDateRetour] = useState(initialDateRetour ?? '');
  const [editing, setEditing] = useState<Editing>(
    initialDateDepart && initialDateRetour ? null : 'start'
  );
  const [heureDepart, setHeureDepart] = useState('09:00');
  const [heureRetour, setHeureRetour] = useState('17:00');
  const [vehiculeId, setVehiculeId] = useState<string | null>(null);
  const [categorieFiltre, setCategorieFiltre] = useState<string | null>(null);
  const [busy, setBusy] = useState<PlageOccupee[]>(initialBusy);
  const [website, setWebsite] = useState(''); // honeypot anti-spam
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [done, setDone] = useState(false);
  const [reference, setReference] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ConducteurData | '_form', string>>>({});
  const [data, setData] = useState<ConducteurData>({
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

  // Rafraîchissement des plages au retour d'onglet (fail-open : le SSR reste).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      getBusyRanges()
        .then((r) => setBusy(r))
        .catch(() => {
          /* fail-open — validateReservation reste la garde */
        });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  const nbJours = nbJoursEntre(dateDepart, dateRetour);
  const plageComplete = Boolean(dateDepart && dateRetour && nbJours > 0 && !editing);
  const wish = wishId ? (cars.find((c) => c.id === wishId) ?? null) : null;
  const vehicule = vehiculeId ? (cars.find((c) => c.id === vehiculeId) ?? null) : null;

  const wishPris = Boolean(
    wish && plageComplete && !vehiculeLibre(busy, wish.id, dateDepart, dateRetour)
  );
  const nbDispoPlage = useMemo(
    () =>
      plageComplete
        ? cars.filter((c) => vehiculeLibre(busy, c.id, dateDepart, dateRetour)).length
        : null,
    [cars, busy, dateDepart, dateRetour, plageComplete]
  );
  const plageMorte = nbDispoPlage === 0;
  const departAlternatif = useMemo(
    () => (plageMorte ? premierDepartPossible(cars, busy, dateDepart, nbJours) : null),
    [plageMorte, cars, busy, dateDepart, nbJours]
  );
  const alternative = useMemo(
    () =>
      wishPris && wish && !plageMorte
        ? meilleureAlternative(cars, busy, wish.id, dateDepart, dateRetour)
        : null,
    [wishPris, wish, plageMorte, cars, busy, dateDepart, dateRetour]
  );
  const altCar = alternative ? (cars.find((c) => c.id === alternative.id) ?? null) : null;
  const wishLibreLe = wish && wishPris ? libreLe(busy, wish.id, dateDepart, dateRetour) : '';

  const prixConnu = Boolean(vehicule && vehicule.prixJourEnCents > 0);
  const totalEnCents = prixConnu && vehicule ? vehicule.prixJourEnCents * nbJours : 0;
  const cautionEnCents = vehicule ? cautionPourVoiture(settings, vehicule) : 0;

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

  // Changer d'acte remonte la scène et y pose le focus ; une validation qui
  // échoue remonte aussi (parité Splash Lane v2).
  const stageRef = useRef<HTMLDivElement | null>(null);
  const revealStage = () => {
    const el = stageRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const firstActe = useRef(true);
  useEffect(() => {
    if (firstActe.current) {
      firstActe.current = false;
      return;
    }
    revealStage();
    stageRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acte]);

  const set = useCallback(<K extends keyof ConducteurData>(k: K, v: ConducteurData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, _form: undefined }));
  }, []);

  // ── Acte 1 : sélection des dates (champ actif, spec R6) ──────────────────
  const clicJour = (jour: string) => {
    setErrors((e) => ({ ...e, _form: undefined }));
    if (editing === 'start' || !dateDepart) {
      const finPrev = dateRetour;
      setDateDepart(jour);
      if (finPrev && finPrev > jour) {
        setEditing(null); // retour conservé, durée recalculée
      } else {
        setDateRetour('');
        setEditing('end');
      }
    } else {
      // editing 'end'
      if (jour > dateDepart) {
        setDateRetour(jour);
        setEditing(null);
      } else {
        setDateDepart(jour); // clic avant le départ = nouveau départ
        setDateRetour('');
        setEditing('end');
      }
    }
    if (vehiculeId && !vehiculeLibre(busy, vehiculeId, jour, dateRetour || jour))
      setVehiculeId(null);
  };

  const ouvrirChamp = (champ: 'start' | 'end') => {
    setEditing(champ);
    const cible = champ === 'end' && dateRetour ? dateRetour : dateDepart;
    if (cible) {
      const delta = nbJoursEntre(demain, cible);
      setOff(Math.max(0, Math.min(HORIZON_JOURS - FENETRE_JOURS, delta - 14)));
    }
  };

  const basculerDates = (nouveauDepart: string) => {
    setDateRetour(addDaysISO(nouveauDepart, nbJours));
    setDateDepart(nouveauDepart);
    setEditing(null);
  };

  const recommencer = () => {
    setDateDepart('');
    setDateRetour('');
    setEditing('start');
    setOff(0);
    setVehiculeId(null);
  };

  // ── Narration ────────────────────────────────────────────────────────────
  const recit = maxRecit(
    {
      acte,
      editing,
      depart: dateDepart ? formatJourCourt(dateDepart) : undefined,
      retour: dateRetour ? formatJourCourt(dateRetour) : undefined,
      nbJours: nbJours || undefined,
      voeu: wish ? `${wish.marque} ${wish.modele}` : undefined,
      alternative: altCar ? `${altCar.marque} ${altCar.modele}` : undefined,
      voeuPris: wishPris,
      plageMorte,
      dispo: acte === 2 ? (nbDispoPlage ?? undefined) : undefined,
    },
    narration
  );
  const note = maxNote(
    { categorie: vehicule?.categorie, nbJours: nbJours || undefined },
    narration
  );

  // Les propositions de Max = ses boutons, sous sa réplique (spec R12).
  const propositions: React.ReactNode[] = [];
  if (acte === 1 && plageComplete && plageMorte && departAlternatif) {
    propositions.push(
      <button
        key="alt-depart"
        type="button"
        onClick={() => basculerDates(departAlternatif)}
        className="cp-ll-oui cp-tap"
      >
        Partir le {formatJourCourt(departAlternatif)} — même durée
      </button>
    );
  }
  if (acte === 1 && plageComplete && !plageMorte && wishPris && wish) {
    if (altCar) {
      propositions.push(
        <button
          key="oui"
          type="button"
          onClick={() => {
            setVehiculeId(altCar.id);
            onClearWish();
          }}
          className="cp-ll-oui cp-tap"
        >
          Oui — partir en {altCar.modele}
          <s>
            {formatPrice(altCar.prixJourEnCents * nbJours)} · {nbJours} j
          </s>
        </button>
      );
    }
    propositions.push(
      <button key="non" type="button" onClick={onClearWish} className="cp-ll-non cp-tap">
        Non — voir tout le parc, sans critère
      </button>
    );
    if (wishLibreLe) {
      propositions.push(
        <button
          key="garder"
          type="button"
          onClick={() => {
            basculerDates(wishLibreLe);
            setVehiculeId(wish.id);
          }}
          className="cp-ll-tiers"
        >
          ou garder le {wish.modele} : partir le {formatJourCourt(wishLibreLe)}
        </button>
      );
    }
  }
  const questionOuverte = propositions.length > 0 && wishPris;

  // ── Navigation d'actes ───────────────────────────────────────────────────
  const acteComplet =
    acte === 1 ? plageComplete && !plageMorte : acte === 2 ? Boolean(vehicule) : true;

  const validerActe = (a: Acte): boolean => {
    const errs: typeof errors = {};
    if (a === 1) {
      if (!plageComplete) errs._form = 'Choisissez votre départ puis votre retour.';
      else if (plageMorte) errs._form = 'Aucun véhicule ne couvre cette plage — décalez le départ.';
      else if (nbJours >= LLD_SEUIL_JOURS)
        errs._form = `Au-delà de ${LLD_SEUIL_JOURS - 1} jours, demandez un devis longue durée.`;
    }
    if (a === 2 && !vehicule) errs._form = 'Choisissez un véhicule.';
    if (a === 3) {
      if (!data.prenom.trim()) errs.prenom = 'Prénom requis';
      if (!data.nom.trim()) errs.nom = 'Nom requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
      if (!/^[0-9\s\+]{8,}$/.test(data.tel)) errs.tel = 'Numéro invalide';
      if (!data.permis.trim()) errs.permis = 'N° de permis requis';
      if (!data.dateNaissance) errs.dateNaissance = 'Date de naissance requise';
      if (!data.dateObtentionPermis) errs.dateObtentionPermis = 'Date d’obtention requise';
      if (!data.adresseRue.trim()) errs.adresseRue = 'Adresse requise';
      if (!/^[0-9A-Za-z\s-]{4,10}$/.test(data.adresseCodePostal))
        errs.adresseCodePostal = 'Code postal requis';
      if (!data.adresseVille.trim()) errs.adresseVille = 'Ville requise';
      if (!data.cgl) errs.cgl = 'Acceptation des conditions de location requise';
      if (!data.consent) errs.consent = 'Consentement requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const allerA = (cible: Acte) => {
    if (cible <= acte) {
      setActe(cible);
      return;
    }
    if (cible > acteMax + 1) return;
    if (!validerActe(acte)) {
      revealStage();
      return;
    }
    setActe(cible);
    setActeMax((m) => (cible > m ? cible : m));
  };

  const suivant = async () => {
    if (!validerActe(acte)) {
      revealStage();
      return;
    }
    if (acte === 3) {
      if (sending) return;
      setSending(true);
      const result = await validateReservation({
        locationCarId: vehicule!.id,
        dateDepart,
        dateRetour,
        heureDepart,
        heureRetour,
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.tel,
        permis: data.permis,
        dateNaissance: data.dateNaissance,
        dateObtentionPermis: data.dateObtentionPermis,
        adresseRue: data.adresseRue,
        adresseCodePostal: data.adresseCodePostal,
        adresseVille: data.adresseVille,
        consent: data.consent,
        cgl: data.cgl,
        marketingOptIn,
        website,
      });
      setSending(false);
      if (!result.success) {
        setErrors(result.errors as Partial<Record<keyof ConducteurData | '_form', string>>);
        revealStage();
        return;
      }
      setReference(result.reference!);
      setDone(true);
      return;
    }
    if (acte === 2 && wish && vehicule && vehicule.id === wish.id) onClearWish();
    const cible = (acte + 1) as Acte;
    setActe(cible);
    setActeMax((m) => (cible > m ? cible : m));
  };

  const err = (k: keyof ConducteurData) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-[0.75rem] text-[#FF8A80]">
        {errors[k]}
      </p>
    ) : null;

  // ── Écran de confirmation (inchangé fonctionnellement) ───────────────────
  if (done && vehicule) {
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
              { k: 'Véhicule', v: `${vehicule.marque} ${vehicule.modele}` },
              { k: 'Retrait', v: `${formatJourCourt(dateDepart)} · ${heureDepart}` },
              { k: 'Restitution', v: `${formatJourCourt(dateRetour)} · ${heureRetour}` },
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
            Un email de confirmation a été envoyé à <strong>{data.email}</strong>
          </p>
          <button
            onClick={() => {
              setDone(false);
              setActe(1);
              setActeMax(1);
              recommencer();
            }}
            className="cp-tap text-sm text-cp-mango hover:underline"
          >
            Faire une nouvelle réservation
          </button>
        </div>
      </section>
    );
  }

  // ── Rail qui raconte (parité v2) ─────────────────────────────────────────
  const labelActe1 = plageComplete ? `${formatJourCourt(dateDepart)} · ${nbJours} j` : 'Les dates';
  const labelActe2 =
    acte > 2 && vehicule ? `${vehicule.modele} · ${formatPrice(totalEnCents)}` : 'Le véhicule';

  // ── Calendrier acte 1 ────────────────────────────────────────────────────
  const renduCalendrier = () => {
    // ZOOM IN : la fenêtre du séjour, lecture seule — l'édition passe par
    // les champs (spec R13).
    if (plageComplete) {
      const jours = fenetreJours(
        addDaysISO(dateDepart, -1) >= demain ? addDaysISO(dateDepart, -1) : dateDepart,
        nbJours + 3
      );
      return (
        <div className="cp-ll-zin" aria-label="Votre séjour, jour par jour">
          {jours.map((j) => {
            const libres = wish
              ? vehiculeLibre(busy, wish.id, j, j)
                ? 1
                : 0
              : libresLeJour(cars, busy, j);
            const total = wish ? 1 : cars.length;
            const jauge = jaugeJour(libres, total);
            const etat =
              j === dateDepart
                ? ' on'
                : j === dateRetour
                  ? ' ret'
                  : j > dateDepart && j < dateRetour
                    ? ' in'
                    : '';
            return (
              <span key={j} className={`cp-ll-dd${etat}`} aria-label={formatJourCourt(j)}>
                <span className="cp-mono block text-[0.52rem] uppercase tracking-[0.12em] opacity-70">
                  {WD_COURT.format(midi(j))}
                </span>
                <span className="cp-title block text-[1.15rem] font-black leading-[1.1]">
                  {midi(j).getDate()}
                </span>
                <span className="cp-ll-g" aria-hidden="true">
                  <i style={{ width: `${jauge.pct}%`, background: jauge.couleur }} />
                </span>
              </span>
            );
          })}
        </div>
      );
    }
    // ZOOM OUT : fenêtre glissante de 6 semaines qui COMMENCE DEMAIN —
    // zéro jour passé (spec R4). Cellules mini : numéro + jauge.
    const premier = addDaysISO(demain, off);
    const lead = (midi(premier).getDay() + 6) % 7; // semaine qui commence lundi
    const jours = fenetreJours(premier, FENETRE_JOURS);
    const maxJour = addDaysISO(demain, HORIZON_JOURS);
    const titre =
      MOIS_LONG.format(midi(premier)) === MOIS_LONG.format(midi(jours[jours.length - 1]))
        ? MOIS_LONG.format(midi(premier))
        : `${MOIS_COURT.format(midi(premier))} — ${MOIS_LONG.format(midi(jours[jours.length - 1]))}`;
    return (
      <>
        <div className="cp-ll-mnav">
          <button
            type="button"
            className="cp-tap"
            disabled={off <= 0}
            onClick={() => setOff((o) => Math.max(0, o - PAS_NAVIGATION))}
            aria-label="4 semaines plus tôt"
          >
            ‹
          </button>
          <b className="cp-title">{titre}</b>
          <button
            type="button"
            className="cp-tap"
            disabled={off >= HORIZON_JOURS - FENETRE_JOURS}
            onClick={() =>
              setOff((o) => Math.min(HORIZON_JOURS - FENETRE_JOURS, o + PAS_NAVIGATION))
            }
            aria-label="4 semaines plus tard"
          >
            ›
          </button>
          <span className="cp-mono cp-ll-cap">
            {wish
              ? `les barres = la dispo du ${wish.marque} ${wish.modele}`
              : editing === 'end'
                ? 'cliquez votre jour de RETOUR'
                : '6 semaines · horizon 1 an'}
          </span>
        </div>
        <div className="cp-ll-cal" role="group" aria-label="Choisir un jour">
          {JOURS_TETE.map((j) => (
            <span key={j} className="cp-ll-head cp-mono">
              {j}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`b${i}`} className="cp-ll-blank" aria-hidden="true" />
          ))}
          {jours.map((j) => {
            const libres = libresLeJour(cars, busy, j);
            const complet = libres <= 0;
            const horsHorizon = j > maxJour;
            const jauge = wish
              ? vehiculeLibre(busy, wish.id, j, j)
                ? { pct: 12, couleur: '#52C88A' }
                : { pct: 100, couleur: '#D92627' }
              : jaugeJour(libres, cars.length);
            const d = midi(j);
            return (
              <button
                key={j}
                type="button"
                disabled={complet || horsHorizon}
                onClick={() => clicJour(j)}
                aria-label={`${formatJourCourt(j)}${complet ? ', complet' : `, ${libres} véhicules disponibles`}`}
                className={`cp-ll-dd cp-ll-mini${j === dateDepart ? ' on' : ''}`}
              >
                {d.getDate() === 1 || j === premier ? (
                  <span className="cp-ll-mo cp-mono">{MOIS_COURT.format(d)}</span>
                ) : null}
                <span className="cp-mono block text-[0.74rem] font-bold">{d.getDate()}</span>
                <span className="cp-ll-g" aria-hidden="true">
                  <i style={{ width: `${jauge.pct}%`, background: jauge.couleur }} />
                </span>
              </button>
            );
          })}
        </div>
        <div className="cp-ll-legend cp-mono" aria-hidden="true">
          {wish ? (
            <>
              <span>
                <i style={{ background: '#52C88A' }} />
                {wish.modele} libre
              </span>
              <span>
                <i style={{ background: '#D92627' }} />
                {wish.modele} pris
              </span>
            </>
          ) : (
            <>
              <span>
                <i style={{ background: '#52C88A' }} />
                ça respire
              </span>
              <span>
                <i style={{ background: '#E9C46A' }} />
                ça se remplit
              </span>
              <span>
                <i style={{ background: '#D92627' }} />
                complet
              </span>
            </>
          )}
        </div>
      </>
    );
  };

  // ── Parcours 3 actes ─────────────────────────────────────────────────────
  return (
    <>
      {/* Bridge astral : le catalogue crème plonge dans la nuit de la Loca Lane */}
      <CpBridge fromColor="#F4EDE0" toColor="#0D0905" accentColor="#52C88A" />
      <section
        id="loca-lane"
        className="cp-pl px-0 pb-0 pt-6"
        style={
          {
            backgroundColor: '#0D0905',
            '--acc': '#52C88A',
            '--acc-ink': '#06231A',
            '--acc-ring': 'rgba(82, 200, 138, 0.45)',
          } as React.CSSProperties
        }
      >
        <div className="cp-pl-wrap mx-auto max-w-6xl">
          {/* En-tête + rail */}
          <div className="px-6 md:px-8">
            <div className="mb-5 flex flex-wrap items-end gap-4">
              <div>
                <p className="cp-mono mb-2 text-xs uppercase tracking-widest text-[var(--acc)]">
                  Loca Lane · Racoon
                </p>
                <h2
                  className="cp-title font-black uppercase leading-none text-cp-cream"
                  style={{ fontSize: 'clamp(1.8rem,3.2vw,2.6rem)' }}
                >
                  D&apos;abord le voyage, ensuite la monture
                </h2>
              </div>
              {wish && (
                <span className="cp-ll-wish cp-mono">
                  vœu : {wish.marque} {wish.modele}
                  <button type="button" onClick={onClearWish} aria-label="Retirer le vœu">
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className="cp-pl-rail" role="group" aria-label="Étapes de la réservation">
              {(
                [
                  { n: 1 as Acte, label: labelActe1 },
                  { n: 2 as Acte, label: labelActe2 },
                  { n: 3 as Acte, label: 'Le conducteur' },
                ] as const
              ).map(({ n, label }, i) => (
                <div key={n} className="contents">
                  {i > 0 && (
                    <span className={`cp-pl-ln${acte >= n ? ' fill' : ''}`} aria-hidden="true">
                      <s />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => allerA(n)}
                    aria-current={acte === n ? 'step' : undefined}
                    className={`cp-pl-nd cp-tap${acte === n ? ' cur' : acte > n ? ' done' : ''}`}
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
              {/* Narration de Max — ses propositions sont SES boutons (R12) */}
              <div className="cp-pl-story">
                <span className="cp-pl-ava">
                  <Image src="/images/mascottes/max.webp" alt="" width={52} height={52} />
                </span>
                <div className="min-w-0">
                  <b className="cp-mono block text-[0.58rem] font-normal uppercase tracking-[0.16em] text-[var(--acc)]">
                    {recit.label}
                  </b>
                  <span
                    aria-live="polite"
                    className="text-[0.86rem] leading-[1.45] text-cp-cream/80"
                  >
                    {recit.text}
                  </span>
                  {propositions.length > 0 && <div className="cp-ll-bacts">{propositions}</div>}
                </div>
              </div>

              {/* Acte 1 — Les dates */}
              {acte === 1 && (
                <div className="cp-pl-pane">
                  {/* Champs Départ / Retour — le champ actif reçoit le clic (R6) */}
                  <div className="cp-ll-slots">
                    <button
                      type="button"
                      onClick={() => ouvrirChamp('start')}
                      className={`cp-ll-slot dep cp-tap${dateDepart ? ' set' : ''}${editing === 'start' ? ' actif' : ''}`}
                    >
                      <b className="cp-mono">Départ</b>
                      <span>
                        {dateDepart
                          ? `${formatJourCourt(dateDepart)}${plageComplete ? ` · ${heureDepart}` : ''}`
                          : 'choisissez un jour'}
                      </span>
                    </button>
                    <span className="cp-ll-fleche" aria-hidden="true">
                      →
                    </span>
                    <button
                      type="button"
                      onClick={() => ouvrirChamp('end')}
                      className={`cp-ll-slot ret cp-tap${dateRetour ? ' set' : ''}${editing === 'end' ? ' actif' : ''}`}
                    >
                      <b className="cp-mono">Retour</b>
                      <span>
                        {dateRetour
                          ? `${formatJourCourt(dateRetour)}${plageComplete ? ` · ${heureRetour}` : ''}`
                          : 'puis le retour'}
                      </span>
                    </button>
                    {nbJours > 0 && (
                      <span className="cp-ll-nj cp-title">
                        {nbJours} j<s className="cp-mono">durée</s>
                      </span>
                    )}
                    {dateDepart && (
                      <button type="button" onClick={recommencer} className="cp-ll-restart cp-mono">
                        ⟲ recommencer
                      </button>
                    )}
                  </div>

                  {renduCalendrier()}

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

                  {/* Heures — pastilles datées, une fois la plage posée (R8) */}
                  {plageComplete && nbJours < LLD_SEUIL_JOURS && (
                    <div className="cp-ll-hrrow">
                      <div>
                        <p className={`${lbl} mt-4`}>Retrait — {formatJourCourt(dateDepart)}</p>
                        <div className="cp-ll-hrs" role="group" aria-label="Heure de retrait">
                          {HEURES.map((h) => (
                            <button
                              key={h}
                              type="button"
                              aria-pressed={heureDepart === h}
                              onClick={() => setHeureDepart(h)}
                              className={`cp-ll-hr cp-mono cp-tap${heureDepart === h ? ' on' : ''}`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className={`${lbl} mt-4`}>Restitution — {formatJourCourt(dateRetour)}</p>
                        <div className="cp-ll-hrs" role="group" aria-label="Heure de restitution">
                          {HEURES.map((h) => (
                            <button
                              key={h}
                              type="button"
                              aria-pressed={heureRetour === h}
                              onClick={() => setHeureRetour(h)}
                              className={`cp-ll-hr cp-mono cp-tap${heureRetour === h ? ' on' : ''}`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Acte 2 — Le véhicule */}
              {acte === 2 && (
                <div className="cp-pl-pane">
                  <p className={lbl}>
                    Catégories — {formatJourCourt(dateDepart)} → {formatJourCourt(dateRetour)}
                  </p>
                  <div className="cp-ll-cats">
                    {[...new Set(cars.map((c) => c.categorie))].map((cat) => {
                      const n = cars.filter(
                        (c) =>
                          c.categorie === cat && vehiculeLibre(busy, c.id, dateDepart, dateRetour)
                      ).length;
                      const on = categorieFiltre === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          disabled={n === 0}
                          aria-pressed={on}
                          onClick={() => setCategorieFiltre(on ? null : cat)}
                          className={`cp-ll-cat cp-mono cp-tap${on ? ' on' : ''}${n === 0 ? ' no' : ''}`}
                        >
                          {cat} · {n}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-2">
                    {cars
                      .filter((c) => !categorieFiltre || c.categorie === categorieFiltre)
                      .map((c) => {
                        const libre = vehiculeLibre(busy, c.id, dateDepart, dateRetour);
                        if (libre) {
                          const on = vehiculeId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setVehiculeId(c.id)}
                              className={`cp-pl-opt cp-tap${on ? ' on' : ''}`}
                            >
                              <i aria-hidden="true" />
                              <span className="min-w-0">
                                <span className="block text-[0.88rem] font-semibold text-cp-cream">
                                  {c.marque} {c.modele}
                                </span>
                                <small className="cp-mono block text-[0.6rem] font-normal text-cp-cream/60">
                                  {c.carburant} · {c.transmission} · {c.places} places
                                </small>
                              </span>
                              <span className="cp-mono ml-auto shrink-0 text-right text-[0.78rem] text-[var(--acc)]">
                                {c.prixJourEnCents > 0 ? (
                                  <>
                                    {formatPrice(c.prixJourEnCents)}/j × {nbJours} j ={' '}
                                    <b className="cp-title text-[1.05rem] font-black text-cp-cream">
                                      {formatPrice(c.prixJourEnCents * nbJours)}
                                    </b>
                                    <s className="block text-[0.56rem] text-cp-cream/40 no-underline">
                                      TTC
                                    </s>
                                  </>
                                ) : (
                                  'Sur devis'
                                )}
                              </span>
                            </button>
                          );
                        }
                        // Indisponible : visible, cadre rouge, date de retour,
                        // alternative en un tap (spec R3).
                        const libere = libreLe(busy, c.id, dateDepart, dateRetour);
                        return (
                          <div key={c.id} className="cp-ll-off">
                            <span className="row">
                              <span className="block text-[0.88rem] font-semibold text-cp-cream">
                                {c.marque} {c.modele}
                              </span>
                              <span className="cp-mono ml-auto text-[0.72rem] text-cp-cream/45">
                                {formatPrice(c.prixJourEnCents)}/j
                              </span>
                            </span>
                            <small className="cp-mono block text-[0.6rem] font-normal text-cp-cream/60">
                              {c.carburant} · {c.transmission} · {c.places} places
                            </small>
                            <span className="cp-ll-band cp-mono">
                              Réservé — libre le {libere ? formatJourCourt(libere) : '—'}
                            </span>
                            {libere && (
                              <button
                                type="button"
                                onClick={() => {
                                  basculerDates(libere);
                                  setVehiculeId(c.id);
                                  setActe(1);
                                }}
                                className="cp-ll-alt"
                              >
                                → Partir le {formatJourCourt(libere)} ? {nbJours} j ={' '}
                                {formatPrice(c.prixJourEnCents * nbJours)}
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Acte 3 — Le conducteur (les heures vivent à l'acte 1, R8) */}
              {acte === 3 && (
                <div className="cp-pl-pane">
                  <p className={lbl}>Le retrait au local — Jarry, Baie-Mahault</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ll-prenom" className={lbl}>
                        Prénom *
                      </label>
                      <input
                        id="ll-prenom"
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
                      <label htmlFor="ll-nom" className={lbl}>
                        Nom *
                      </label>
                      <input
                        id="ll-nom"
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
                      <label htmlFor="ll-email" className={lbl}>
                        Email *
                      </label>
                      <input
                        id="ll-email"
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
                      <label htmlFor="ll-tel" className={lbl}>
                        Téléphone / WhatsApp *
                      </label>
                      <input
                        id="ll-tel"
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
                      <label htmlFor="ll-naissance" className={lbl}>
                        Date de naissance *
                      </label>
                      <input
                        id="ll-naissance"
                        className={fld}
                        type="date"
                        autoComplete="bday"
                        value={data.dateNaissance}
                        onChange={(e) => set('dateNaissance', e.target.value)}
                      />
                      {err('dateNaissance')}
                    </div>
                    <div>
                      <label htmlFor="ll-obtention" className={lbl}>
                        Permis — délivré le *
                      </label>
                      <input
                        id="ll-obtention"
                        className={fld}
                        type="date"
                        value={data.dateObtentionPermis}
                        onChange={(e) => set('dateObtentionPermis', e.target.value)}
                      />
                      {err('dateObtentionPermis')}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="ll-permis" className={lbl}>
                        N° de permis *
                      </label>
                      <input
                        id="ll-permis"
                        className={`${fld} cp-mono tracking-widest`}
                        type="text"
                        placeholder="12AA34567"
                        autoComplete="off"
                        value={data.permis}
                        onChange={(e) => set('permis', e.target.value.toUpperCase())}
                      />
                      {err('permis')}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="ll-rue" className={lbl}>
                        Adresse *
                      </label>
                      <input
                        id="ll-rue"
                        className={fld}
                        type="text"
                        autoComplete="street-address"
                        placeholder="12 rue des Alizés"
                        value={data.adresseRue}
                        onChange={(e) => set('adresseRue', e.target.value)}
                      />
                      {err('adresseRue')}
                    </div>
                    <div>
                      <label htmlFor="ll-cp" className={lbl}>
                        Code postal *
                      </label>
                      <input
                        id="ll-cp"
                        className={fld}
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="97122"
                        value={data.adresseCodePostal}
                        onChange={(e) => set('adresseCodePostal', e.target.value)}
                      />
                      {err('adresseCodePostal')}
                    </div>
                    <div>
                      <label htmlFor="ll-ville" className={lbl}>
                        Ville *
                      </label>
                      <input
                        id="ll-ville"
                        className={fld}
                        type="text"
                        autoComplete="address-level2"
                        placeholder="Baie-Mahault"
                        value={data.adresseVille}
                        onChange={(e) => set('adresseVille', e.target.value)}
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
                  <p className="mt-3 text-[0.74rem] leading-[1.5] text-cp-cream/60">
                    Conditions : {settings.ageMinimum} ans minimum,{' '}
                    {settings.permisAncienneteMinAnnees} an
                    {settings.permisAncienneteMinAnnees > 1 ? 's' : ''} de permis. État des lieux
                    photo signé sur place, 15 minutes. Même niveau de carburant au retour. Original
                    du permis et pièce d&apos;identité vérifiés à la remise des clés — aucune copie
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
                        id="ll-cgl"
                        type="checkbox"
                        checked={data.cgl}
                        onChange={(e) => set('cgl', e.target.checked)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#52C88A]"
                      />
                      <label
                        htmlFor="ll-cgl"
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
                        id="ll-consent"
                        type="checkbox"
                        checked={data.consent}
                        onChange={(e) => set('consent', e.target.checked)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#52C88A]"
                      />
                      <label
                        htmlFor="ll-consent"
                        className="cursor-pointer text-xs leading-relaxed text-cp-cream/60"
                      >
                        J&apos;accepte que mes données soient utilisées pour traiter ma réservation
                        (conservées 12 mois, jamais transmises à des tiers).
                      </label>
                    </div>
                    {err('consent')}
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
                    Max Explorer
                  </b>
                  <span className="text-[0.78rem] leading-[1.4] text-cp-cream/70">{note}</span>
                </span>
                <Image
                  src="/images/mascottes/max-iso.webp"
                  alt=""
                  width={120}
                  height={120}
                  className="cp-pl-mascotte"
                />
              </div>

              {/* Ticket : chaque ligne RACONTE un choix et y RAMÈNE (parité v2) */}
              <div className="cp-pl-tk cp-mono" aria-live="polite">
                <button
                  type="button"
                  onClick={() => allerA(1)}
                  aria-label="Modifier les dates ou les heures (retour à l'acte 1)"
                  className="cp-pl-tr cp-pl-tr-edit"
                >
                  <span>
                    {dateDepart ? `${formatJourCourt(dateDepart)} · ${heureDepart}` : 'départ —'}
                  </span>
                  <span>
                    {dateRetour
                      ? `→ ${formatJourCourt(dateRetour)} · ${heureRetour}`
                      : '→ retour —'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => allerA(2)}
                  aria-label="Modifier le véhicule (retour à l'acte 2)"
                  className="cp-pl-tr cp-pl-tr-edit dim"
                >
                  <span className="uppercase">
                    {vehicule ? vehicule.modele : wish ? `vœu : ${wish.modele}` : 'véhicule —'}
                  </span>
                  <span>{vehicule?.categorie ?? wish?.categorie ?? ''}</span>
                </button>
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

              <p className="mt-3 text-[0.74rem] leading-[1.5] text-cp-cream/60">
                {cautionEnCents > 0
                  ? `Caution ${formatPrice(cautionEnCents)} par empreinte CB, non débitée. `
                  : ''}
                Pas de paiement en ligne : nous confirmons sur WhatsApp sous 24 h ouvrées.
                Annulation libre jusqu&apos;à 12 h avant le retrait.
              </p>

              <div className="mt-auto flex gap-2 pt-4">
                {acte > 1 && (
                  <button
                    type="button"
                    onClick={() => setActe((a) => (a - 1) as Acte)}
                    className="cp-tap flex-1 rounded-xl border border-[rgba(244,237,224,0.18)] px-4 py-3 text-sm font-semibold text-cp-cream/70 transition-colors hover:border-[rgba(244,237,224,0.4)] hover:text-cp-cream"
                  >
                    Retour
                  </button>
                )}
                <button
                  type="button"
                  onClick={suivant}
                  disabled={sending}
                  className={`cp-tap flex-1 rounded-xl px-4 py-3 text-sm font-bold text-[var(--acc-ink)] transition-opacity hover:opacity-90 disabled:opacity-60${acteComplet && acte < 3 && !questionOuverte ? ' cp-pl-pulse' : ''}`}
                  style={{ background: 'var(--acc)' }}
                >
                  {acte === 3 ? (sending ? 'Envoi…' : 'Confirmer la réservation') : 'Continuer'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Barre collante mobile (< 700 px conteneur) ── */}
          <div className="cp-pl-sticky">
            <div className="min-w-0">
              <p className="cp-mono truncate text-[0.6rem] uppercase tracking-[0.1em] text-cp-cream/70">
                {plageComplete ? `${formatJourCourt(dateDepart)} · ${nbJours} j` : 'Dates —'}
                {vehicule ? ` · ${vehicule.modele}` : ''}
              </p>
              <p className="cp-title text-lg font-black leading-none text-cp-mango">
                {prixConnu && nbJours > 0 ? formatPrice(totalEnCents) : '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={suivant}
              disabled={sending}
              className={`cp-tap shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-[var(--acc-ink)] disabled:opacity-60${acteComplet && acte < 3 && !questionOuverte ? ' cp-pl-pulse' : ''}`}
              style={{ background: 'var(--acc)' }}
            >
              {acte === 3 ? (sending ? 'Envoi…' : 'Confirmer') : 'Continuer'}
            </button>
          </div>
        </div>
      </section>
      {/* Bridge de sortie : la nuit remonte vers la bande univers */}
      <CpBridge fromColor="#0D0905" toColor="#F4EDE0" accentColor="#52C88A" />
    </>
  );
}
