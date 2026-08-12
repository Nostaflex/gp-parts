'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import type { LocationCar } from '@/lib/location-cars';
import type { LocationSettings } from '@/lib/location-settings';
import { cautionPourVoiture } from '@/lib/location-settings';
import { ageAtDate, yearsBetween, LLD_SEUIL_JOURS } from '@/lib/reservations';
import { formatPrice, localDateISO } from '@/lib/utils';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { validateReservation, checkDispo, submitDevisLLD } from './actions';

type Categorie = 'Toutes' | 'Citadine' | 'Berline' | 'SUV' | 'Utilitaire';
type Step = 0 | 1 | 2;

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

const CATEGORIES: Categorie[] = ['Toutes', 'Citadine', 'Berline', 'SUV', 'Utilitaire'];

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-red focus:ring-2 focus:ring-cp-mango/10';
const lbl = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

function calcNbJours(depart: string, retour: string): number {
  if (!depart || !retour) return 0;
  const d1 = new Date(depart);
  const d2 = new Date(retour);
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export function LocationClient({
  cars,
  settings,
}: {
  cars: LocationCar[];
  settings: LocationSettings;
}) {
  const VEHICULES = cars;
  const [categorie, setCategorie] = useState<Categorie>('Toutes');
  const [dateDepart, setDateDepart] = useState('');
  const [dateRetour, setDateRetour] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [website, setWebsite] = useState(''); // honeypot anti-spam
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationData | '_form', string>>>(
    {}
  );
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<ReservationData>({
    vehiculeId: '',
    dateDepart: '',
    dateRetour: '',
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
  const [showDevisLLD, setShowDevisLLD] = useState(false);

  // Dates choisies → pré-filtre dispo (best-effort ; la garde finale est serveur)
  useEffect(() => {
    if (!dateDepart || !dateRetour || dateRetour < dateDepart) {
      setUnavailableIds([]);
      return;
    }
    let cancelled = false;
    checkDispo(dateDepart, dateRetour).then(({ unavailableIds: ids }) => {
      if (!cancelled) setUnavailableIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [dateDepart, dateRetour]);

  const vehiculesFiltres = useMemo(
    () => VEHICULES.filter((v) => categorie === 'Toutes' || v.categorie === categorie),
    [VEHICULES, categorie]
  );

  const vehiculeSelectionne = VEHICULES.find((v) => v.id === selectedId);
  const nbJours = calcNbJours(formData.dateDepart || dateDepart, formData.dateRetour || dateRetour);
  const prixTotalEnCents = vehiculeSelectionne ? vehiculeSelectionne.prixJourEnCents * nbJours : 0;

  const setForm = <K extends keyof ReservationData>(k: K, v: ReservationData[K]) => {
    setFormData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const openReservation = (id: string) => {
    setSelectedId(id);
    setFormData((d) => ({ ...d, vehiculeId: id, dateDepart, dateRetour }));
    setShowForm(true);
    setStep(0);
    // Le formulaire est rendu en bas de page (après le catalogue) : sans ce
    // scroll, le clic « Réserver » paraît sans effet. requestAnimationFrame
    // laisse React peindre la section avant de scroller.
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (step === 0) {
      if (!formData.dateDepart) errs.dateDepart = 'Date de départ requise';
      if (!formData.dateRetour) errs.dateRetour = 'Date de retour requise';
      else if (calcNbJours(formData.dateDepart, formData.dateRetour) <= 0)
        errs.dateRetour = 'Date de retour invalide';
      else if (calcNbJours(formData.dateDepart, formData.dateRetour) >= LLD_SEUIL_JOURS)
        errs.dateRetour = `Au-delà de ${LLD_SEUIL_JOURS - 1} jours, demandez un devis longue durée ci-dessous.`;
    }
    if (step === 1) {
      if (!formData.prenom.trim()) errs.prenom = 'Prénom requis';
      if (!formData.nom.trim()) errs.nom = 'Nom requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email invalide';
      if (!/^[0-9\s\+]{8,}$/.test(formData.tel)) errs.tel = 'Numéro invalide';
      if (!formData.permis.trim()) errs.permis = 'N° de permis requis';
      const dep = formData.dateDepart;
      if (!formData.dateNaissance) {
        errs.dateNaissance = 'Date de naissance requise';
      } else if (dep && ageAtDate(formData.dateNaissance, dep) < settings.ageMinimum) {
        errs.dateNaissance = `Âge minimum : ${settings.ageMinimum} ans à la date de départ`;
      }
      if (!formData.dateObtentionPermis) {
        errs.dateObtentionPermis = 'Date d’obtention requise';
      } else if (
        dep &&
        yearsBetween(formData.dateObtentionPermis, dep) < settings.permisAncienneteMinAnnees
      ) {
        errs.dateObtentionPermis = `Permis requis depuis au moins ${settings.permisAncienneteMinAnnees} an(s)`;
      }
      if (!formData.adresseRue.trim()) errs.adresseRue = 'Adresse requise';
      if (!/^[0-9A-Za-z\s-]{4,10}$/.test(formData.adresseCodePostal))
        errs.adresseCodePostal = 'Code postal requis';
      if (!formData.adresseVille.trim()) errs.adresseVille = 'Ville requise';
    }
    if (step === 2) {
      if (!formData.cgl) errs.cgl = 'Acceptation des conditions de location requise';
      if (!formData.consent) errs.consent = 'Consentement requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = async () => {
    if (!validate()) return;
    if (step === 0 && formData.vehiculeId) {
      // Vérif dispo du véhicule choisi sur les dates du formulaire
      const { unavailableIds: ids } = await checkDispo(formData.dateDepart, formData.dateRetour);
      if (ids.includes(formData.vehiculeId)) {
        setErrors({ dateRetour: 'Ce véhicule est déjà réservé sur ces dates.' });
        return;
      }
    }
    if (step === 2) {
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
      if (!result.success) {
        setErrors(result.errors as Partial<Record<keyof ReservationData | '_form', string>>);
        return;
      }
      setRef(result.reference!);
      setDone(true);
      return;
    }
    setStep((s) => (s + 1) as Step);
  };

  const err = (k: keyof ReservationData) =>
    errors[k] ? <p className="text-[0.75rem] text-red-500 mt-1">{errors[k]}</p> : null;

  if (done) {
    return (
      <section className="py-24 px-6" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-[#E9C46A]/15 border-2 border-[#E9C46A]/25 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="text-[#C8A040]" size={36} strokeWidth={1.5} />
          </div>
          <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-3">
            Réservation confirmée
          </p>
          <h2
            className="cp-title font-black text-cp-ink leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)' }}
          >
            VOTRE VÉHICULE
            <br />
            <em className="text-cp-mango not-italic">EST RÉSERVÉ</em>
          </h2>
          <p className="text-cp-ink/55 text-base leading-relaxed mb-8 max-w-md mx-auto">
            Votre réservation a bien été enregistrée. Nous vous contactons sous 2h pour confirmer
            les modalités de remise.
          </p>
          <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 text-left mb-6 shadow-sm">
            <p className="cp-mono text-xs text-[#C8A040] uppercase tracking-wider mb-4">
              Récapitulatif
            </p>
            {[
              { k: 'Référence', v: ref },
              { k: 'Véhicule', v: `${vehiculeSelectionne?.marque} ${vehiculeSelectionne?.modele}` },
              {
                k: 'Départ',
                v: formData.dateDepart
                  ? new Date(formData.dateDepart).toLocaleDateString('fr-FR')
                  : '',
              },
              {
                k: 'Retour',
                v: formData.dateRetour
                  ? new Date(formData.dateRetour).toLocaleDateString('fr-FR')
                  : '',
              },
              { k: 'Durée', v: `${nbJours} jour${nbJours > 1 ? 's' : ''}` },
              { k: 'Total TTC', v: formatPrice(prixTotalEnCents) },
            ].map(({ k, v }) => (
              <div
                key={k}
                className="flex justify-between py-2 border-b border-[#F8F5F0] last:border-0"
              >
                <span className="text-xs text-cp-ink/50">{k}</span>
                <span className="text-xs font-semibold text-cp-ink">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-cp-ink/40 mb-8">
            Un email de confirmation a été envoyé à <strong>{formData.email}</strong>
          </p>
          <button
            onClick={() => {
              setDone(false);
              setShowForm(false);
              setSelectedId(null);
              setStep(0);
            }}
            className="text-sm text-cp-mango hover:underline"
          >
            Faire une nouvelle réservation
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* ── SEARCH ─────────────────────────── */}
      <section className="px-6 py-16 pt-32" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-3">
              Nos véhicules
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none"
              style={{ fontSize: 'clamp(2.5rem,4vw,3.5rem)' }}
            >
              Trouvez votre <em className="text-cp-mango not-italic">véhicule</em>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DDD3] shadow-[0_8px_40px_rgba(26,15,6,0.08)] p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-cp-ink/70 mb-1.5">
                  Date de départ
                </label>
                <input
                  type="date"
                  className={field}
                  min={localDateISO(1)}
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cp-ink/70 mb-1.5">
                  Date de retour
                </label>
                <input
                  type="date"
                  className={field}
                  min={dateDepart || localDateISO(2)}
                  value={dateRetour}
                  onChange={(e) => setDateRetour(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cp-ink/70 mb-1.5">
                  Catégorie
                </label>
                <select
                  className={field}
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as Categorie)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Toutes' ? 'Toutes catégories' : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATALOGUE ──────────────────────── */}
      <section className="px-6 pb-24" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="cp-mono text-xs text-cp-ink/40 tracking-wider">
              {vehiculesFiltres.length} véhicule{vehiculesFiltres.length > 1 ? 's' : ''} disponible
              {vehiculesFiltres.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              {CATEGORIES.filter((c) => c !== 'Toutes').map((c) => (
                <button
                  key={c}
                  onClick={() => setCategorie(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${categorie === c ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-red hover:text-cp-mango'}`}
                >
                  {c}
                </button>
              ))}
              {categorie !== 'Toutes' && (
                <button
                  onClick={() => setCategorie('Toutes')}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#E5DDD3] text-cp-ink/40 hover:border-cp-red hover:text-cp-mango transition-all"
                >
                  Tout
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculesFiltres.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(26,15,6,0.10)]"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-[#F8F5F0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.image}
                    alt={`${v.marque} ${v.modele}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    className={`absolute top-3 left-3 text-white text-[0.65rem] cp-mono px-3 py-1 rounded-full ${
                      unavailableIds.includes(v.id)
                        ? 'bg-[#B85450]/90'
                        : v.disponible
                          ? 'bg-[#7A9B76]/90'
                          : 'bg-[#D4A24C]/90'
                    }`}
                  >
                    {unavailableIds.includes(v.id)
                      ? 'Indisponible à ces dates'
                      : v.disponible
                        ? 'Disponible'
                        : 'Stock limité'}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#1A0F06]/85 to-transparent">
                    <p className="cp-title text-[0.75rem] font-bold text-[#E9C46A] tracking-widest uppercase">
                      {v.marque}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="cp-title font-black text-cp-ink text-xl mb-2">{v.modele}</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { icon: '👤', val: `${v.places} places` },
                      { icon: '⚙️', val: v.transmission },
                      { icon: '⛽', val: v.carburant },
                    ].map((s) => (
                      <span
                        key={s.val}
                        className="cp-mono text-[0.65rem] text-cp-ink/50 tracking-wide flex items-center gap-1"
                      >
                        {s.val}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-end justify-between pt-4 border-t border-[#F8F5F0]">
                    <div>
                      <p className="cp-title font-black text-cp-mango text-2xl leading-none">
                        {formatPrice(v.prixJourEnCents)}
                        <span className="text-sm font-normal text-cp-ink/40">/jour</span>
                      </p>
                      <p className="text-xs text-cp-ink/35 mt-0.5">
                        {formatPrice(v.prixSemaineEnCents)}/semaine
                      </p>
                    </div>
                    <button
                      onClick={() => openReservation(v.id)}
                      disabled={unavailableIds.includes(v.id)}
                      className="px-4 py-2 rounded-xl bg-cp-red/10 border border-cp-red/20 text-cp-mango text-sm font-semibold hover:bg-cp-red/20 hover:border-cp-red/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cp-red/10 disabled:hover:border-cp-red/20"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVIS LONGUE DURÉE (≥ 30 j) ────── */}
      {showDevisLLD && (
        <DevisLLDSection
          onClose={() => setShowDevisLLD(false)}
          dureeInitialeMois={nbJours >= LLD_SEUIL_JOURS ? String(Math.round(nbJours / 30)) : ''}
        />
      )}

      {/* ── FORMULAIRE RÉSERVATION ─────────── */}
      {showForm && vehiculeSelectionne && !showDevisLLD && (
        <section
          ref={formSectionRef}
          className="py-24 px-6 pt-32"
          style={{ backgroundColor: '#2C1A08' }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Info */}
            <div className="lg:sticky lg:top-24">
              <p className="cp-mono text-[#E9C46A] text-xs tracking-widest uppercase mb-4">
                Votre réservation
              </p>
              <h2
                className="cp-title font-black text-cp-cream leading-none mb-6"
                style={{ fontSize: 'clamp(2rem,3.5vw,3rem)' }}
              >
                RÉSERVEZ
                <br />
                <em className="text-[#E9C46A] not-italic">{vehiculeSelectionne.marque}</em>
                <br />
                {vehiculeSelectionne.modele}
              </h2>
              <p className="text-cp-cream/45 text-sm leading-relaxed mb-8 max-w-sm">
                Kilométrage illimité, assurance tous risques incluse. Remise en main propre dans
                notre garage à Pointe-à-Pitre.
              </p>

              {/* Conditions */}
              {[
                { title: 'Permis B requis', desc: 'Valide depuis plus de 2 ans' },
                { title: 'Caution', desc: '500 € par empreinte bancaire' },
                { title: 'Carburant', desc: 'Rendu plein, reçu plein' },
                { title: 'Kilométrage', desc: 'Illimité — sans frais cachés' },
              ].map((c) => (
                <div key={c.title} className="flex gap-3 items-start mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#E9C46A]/10 border border-[#E9C46A]/15 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E9C46A]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-cp-cream">{c.title}</p>
                    <p className="text-xs text-cp-cream/40 mt-0.5">{c.desc}</p>
                  </div>
                </div>
              ))}

              {nbJours > 0 && (
                <div className="mt-6 bg-[#1A0F06]/50 rounded-xl p-4 border border-[#E9C46A]/10">
                  <p className="cp-mono text-[0.65rem] text-[#E9C46A] uppercase tracking-widest mb-3">
                    Estimation
                  </p>
                  <div className="flex justify-between text-sm text-cp-cream/60 mb-1">
                    <span>
                      {nbJours} jour{nbJours > 1 ? 's' : ''} ×{' '}
                      {formatPrice(vehiculeSelectionne.prixJourEnCents)}
                    </span>
                    <span>{formatPrice(vehiculeSelectionne.prixJourEnCents * nbJours)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-cp-cream border-t border-[#E9C46A]/10 pt-2 mt-2">
                    <span>Total TTC</span>
                    <span className="text-[#E9C46A]">{formatPrice(prixTotalEnCents)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
              {/* Header */}
              <div className="px-6 py-4 bg-cp-ink flex items-center justify-between">
                <p className="cp-title font-black text-cp-cream text-lg">
                  Formulaire de réservation
                </p>
                <div className="flex gap-1.5">
                  {([0, 1, 2] as Step[]).map((i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i < step ? 'bg-[#E9C46A]/40' : i === step ? 'bg-[#E9C46A]' : 'bg-[#E9C46A]/15'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Progress bars */}
              <div className="flex gap-1 px-6 py-3 bg-cp-ink/5">
                {([0, 1, 2] as Step[]).map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-0.5 rounded-full transition-colors ${i < step ? 'bg-[#C8A040]/40' : i === step ? 'bg-[#C8A040]' : 'bg-[#E5DDD3]'}`}
                  />
                ))}
              </div>

              <div className="p-6">
                {/* Step 0 — Véhicule + dates */}
                {step === 0 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                        Étape 1 / 3
                      </p>
                      <p className="cp-title font-black text-cp-ink text-xl">Véhicule & dates</p>
                      <p className="text-xs text-cp-ink/40 mt-1">
                        Confirmez les dates de votre location
                      </p>
                    </div>

                    <div className="bg-[#F8F5F0] rounded-xl p-4 flex gap-4 items-center">
                      <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vehiculeSelectionne.image}
                          alt={vehiculeSelectionne.modele}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="cp-title font-black text-cp-ink">
                          {vehiculeSelectionne.marque} {vehiculeSelectionne.modele}
                        </p>
                        <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-wide">
                          {vehiculeSelectionne.categorie} ·{' '}
                          {formatPrice(vehiculeSelectionne.prixJourEnCents)}/jour
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Départ *</label>
                        <input
                          type="date"
                          className={field}
                          min={localDateISO(1)}
                          value={formData.dateDepart}
                          onChange={(e) => setForm('dateDepart', e.target.value)}
                        />
                        {err('dateDepart')}
                      </div>
                      <div>
                        <label className={lbl}>Retour *</label>
                        <input
                          type="date"
                          className={field}
                          min={formData.dateDepart || localDateISO(2)}
                          value={formData.dateRetour}
                          onChange={(e) => setForm('dateRetour', e.target.value)}
                        />
                        {err('dateRetour')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="heureDepart" className={lbl}>
                          Heure de prise
                        </label>
                        <select
                          id="heureDepart"
                          className={field}
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
                        <label htmlFor="heureRetour" className={lbl}>
                          Heure de restitution
                        </label>
                        <select
                          id="heureRetour"
                          className={field}
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

                    {nbJours >= LLD_SEUIL_JOURS && (
                      <div className="bg-[#F8F5F0] border border-[#E9C46A]/60 rounded-xl p-4">
                        <p className="text-sm font-semibold text-cp-ink mb-1">
                          Location longue durée ({nbJours} jours)
                        </p>
                        <p className="text-xs text-cp-ink/55 leading-relaxed mb-3">
                          Au-delà de {LLD_SEUIL_JOURS - 1} jours, nous établissons un devis
                          personnalisé (tarif dégressif, contrat adapté). Réponse sous 48 h.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowDevisLLD(true)}
                          className="px-4 py-2 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-red transition-colors"
                        >
                          Demander un devis longue durée
                        </button>
                      </div>
                    )}

                    {nbJours > 0 && nbJours < LLD_SEUIL_JOURS && (
                      <div className="bg-[#F8F5F0] rounded-xl p-4">
                        <div className="flex justify-between text-sm text-cp-ink/60 mb-1">
                          <span>
                            {nbJours} jour{nbJours > 1 ? 's' : ''} ×{' '}
                            {formatPrice(vehiculeSelectionne.prixJourEnCents)}
                          </span>
                          <span>{formatPrice(vehiculeSelectionne.prixJourEnCents * nbJours)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-cp-ink border-t border-[#E5DDD3] pt-2 mt-2">
                          <span className="text-sm">Total TTC</span>
                          <span className="text-cp-mango">{formatPrice(prixTotalEnCents)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1 — Conducteur */}
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                        Étape 2 / 3
                      </p>
                      <p className="cp-title font-black text-cp-ink text-xl">
                        Informations conducteur
                      </p>
                      <p className="text-xs text-cp-ink/40 mt-1">
                        Vos coordonnées et votre permis de conduire
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="prenom" className={lbl}>
                          Prénom *
                        </label>
                        <input
                          id="prenom"
                          className={field}
                          type="text"
                          autoComplete="given-name"
                          placeholder="Marie"
                          value={formData.prenom}
                          onChange={(e) => setForm('prenom', e.target.value)}
                        />
                        {err('prenom')}
                      </div>
                      <div>
                        <label htmlFor="nom" className={lbl}>
                          Nom *
                        </label>
                        <input
                          id="nom"
                          className={field}
                          type="text"
                          autoComplete="family-name"
                          placeholder="Dupont"
                          value={formData.nom}
                          onChange={(e) => setForm('nom', e.target.value)}
                        />
                        {err('nom')}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className={lbl}>
                        Email *
                      </label>
                      <input
                        id="email"
                        className={field}
                        type="email"
                        autoComplete="email"
                        placeholder="marie.dupont@email.com"
                        value={formData.email}
                        onChange={(e) => setForm('email', e.target.value)}
                      />
                      {err('email')}
                    </div>
                    <div>
                      <label htmlFor="tel" className={lbl}>
                        Téléphone *
                      </label>
                      <input
                        id="tel"
                        className={field}
                        type="tel"
                        autoComplete="tel"
                        placeholder="0690 00 00 00"
                        value={formData.tel}
                        onChange={(e) => setForm('tel', e.target.value)}
                      />
                      {err('tel')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="dateNaissance" className={lbl}>
                          Date de naissance *
                        </label>
                        <input
                          id="dateNaissance"
                          className={field}
                          type="date"
                          autoComplete="bday"
                          value={formData.dateNaissance}
                          onChange={(e) => setForm('dateNaissance', e.target.value)}
                        />
                        {err('dateNaissance')}
                      </div>
                      <div>
                        <label htmlFor="dateObtentionPermis" className={lbl}>
                          Permis obtenu le *
                        </label>
                        <input
                          id="dateObtentionPermis"
                          className={field}
                          type="date"
                          value={formData.dateObtentionPermis}
                          onChange={(e) => setForm('dateObtentionPermis', e.target.value)}
                        />
                        {err('dateObtentionPermis')}
                      </div>
                    </div>
                    <p className="text-[0.7rem] text-cp-ink/40 -mt-2">
                      Conditions : {settings.ageMinimum} ans minimum,{' '}
                      {settings.permisAncienneteMinAnnees} an
                      {settings.permisAncienneteMinAnnees > 1 ? 's' : ''} de permis. Original du
                      permis et pièce d&apos;identité vérifiés à la remise des clés — aucune copie
                      n&apos;est stockée en ligne.
                    </p>
                    <div>
                      <label htmlFor="permis" className={lbl}>
                        N° de permis *
                      </label>
                      <input
                        id="permis"
                        className={`${field} cp-mono tracking-widest`}
                        type="text"
                        placeholder="12AA34567"
                        autoComplete="off"
                        value={formData.permis}
                        onChange={(e) => setForm('permis', e.target.value.toUpperCase())}
                      />
                      {err('permis')}
                    </div>
                    <div>
                      <label htmlFor="adresseRue" className={lbl}>
                        Adresse *
                      </label>
                      <input
                        id="adresseRue"
                        className={field}
                        type="text"
                        autoComplete="street-address"
                        placeholder="12 rue des Alizés"
                        value={formData.adresseRue}
                        onChange={(e) => setForm('adresseRue', e.target.value)}
                      />
                      {err('adresseRue')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="adresseCodePostal" className={lbl}>
                          Code postal *
                        </label>
                        <input
                          id="adresseCodePostal"
                          className={field}
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
                        <label htmlFor="adresseVille" className={lbl}>
                          Ville *
                        </label>
                        <input
                          id="adresseVille"
                          className={field}
                          type="text"
                          autoComplete="address-level2"
                          placeholder="Baie-Mahault"
                          value={formData.adresseVille}
                          onChange={(e) => setForm('adresseVille', e.target.value)}
                        />
                        {err('adresseVille')}
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
                  </div>
                )}

                {/* Step 2 — Recap + consentement */}
                {step === 2 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                        Étape 3 / 3
                      </p>
                      <p className="cp-title font-black text-cp-ink text-xl">Récapitulatif</p>
                      <p className="text-xs text-cp-ink/40 mt-1">Vérifiez avant de confirmer</p>
                    </div>

                    <div className="bg-[#F8F5F0] rounded-xl p-4">
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-3">
                        Votre réservation
                      </p>
                      {[
                        {
                          k: 'Véhicule',
                          v: `${vehiculeSelectionne.marque} ${vehiculeSelectionne.modele}`,
                        },
                        {
                          k: 'Départ',
                          v: formData.dateDepart
                            ? `${new Date(formData.dateDepart).toLocaleDateString('fr-FR')} · ${formData.heureDepart}`
                            : '',
                        },
                        {
                          k: 'Retour',
                          v: formData.dateRetour
                            ? `${new Date(formData.dateRetour).toLocaleDateString('fr-FR')} · ${formData.heureRetour}`
                            : '',
                        },
                        { k: 'Durée', v: `${nbJours} jour${nbJours > 1 ? 's' : ''}` },
                        { k: 'Conducteur', v: `${formData.prenom} ${formData.nom}` },
                        { k: 'Total TTC', v: formatPrice(prixTotalEnCents) },
                        {
                          k: 'Caution (au comptoir)',
                          v: formatPrice(cautionPourVoiture(settings, vehiculeSelectionne)),
                        },
                      ].map(({ k, v }) => (
                        <div
                          key={k}
                          className="flex justify-between py-1.5 border-b border-[#E5DDD3]/50 last:border-0"
                        >
                          <span className="text-xs text-cp-ink/50">{k}</span>
                          <span
                            className={`text-xs font-semibold ${k === 'Total TTC' ? 'text-cp-mango' : 'text-cp-ink'}`}
                          >
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[0.7rem] text-cp-ink/45 leading-relaxed">
                      La caution est une empreinte bancaire prise à la remise des clés, libérée à la
                      restitution du véhicule en l&apos;état. Franchise selon les conditions
                      d&apos;assurance du contrat. Carburant : rendu au niveau de départ.
                    </p>

                    <div className="border border-[#E5DDD3] rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          id="cgl"
                          type="checkbox"
                          checked={formData.cgl}
                          onChange={(e) => setForm('cgl', e.target.checked)}
                          className="w-4 h-4 accent-cp-mango cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <label
                          htmlFor="cgl"
                          className="text-xs text-cp-ink/60 leading-relaxed cursor-pointer"
                        >
                          J&apos;ai lu et j&apos;accepte les{' '}
                          <Link
                            href="/location/cgl"
                            target="_blank"
                            className="text-cp-mango underline"
                          >
                            conditions générales de location
                          </Link>{' '}
                          et je confirme l&apos;exactitude des informations fournies.
                        </label>
                      </div>
                      {err('cgl')}
                      <div className="flex items-start gap-3">
                        <input
                          id="consent"
                          type="checkbox"
                          checked={formData.consent}
                          onChange={(e) => setForm('consent', e.target.checked)}
                          className="w-4 h-4 accent-cp-mango cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <label
                          htmlFor="consent"
                          className="text-xs text-cp-ink/60 leading-relaxed cursor-pointer"
                        >
                          J&apos;accepte que mes données soient utilisées pour traiter ma
                          réservation (conservées 12 mois, jamais transmises à des tiers).
                        </label>
                      </div>
                      {err('consent')}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                {errors._form && (
                  <p role="alert" className="text-[0.8rem] text-red-500 mt-4">
                    {errors._form}
                  </p>
                )}
                <div className="flex gap-3 mt-6">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => (s - 1) as Step)}
                      className="flex items-center gap-2 text-sm font-medium text-cp-ink/50 hover:text-cp-ink transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Retour
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex items-center gap-2 text-sm font-medium text-cp-ink/50 hover:text-cp-ink transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Catalogue
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={next}
                    className="flex-1 py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-red transition-colors flex items-center justify-center gap-2"
                  >
                    {step === 2 ? 'Confirmer la réservation' : 'Continuer'}
                    {step < 2 && (
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
                <CpRgpdNotice className="mt-4" />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** Devis longue durée (≥ 30 jours) — décision 2026-07-31 : devis en ligne,
 * contrat LLD signé en agence. La demande arrive dans la boîte Demandes BO. */
function DevisLLDSection({
  onClose,
  dureeInitialeMois,
}: {
  onClose: () => void;
  dureeInitialeMois: string;
}) {
  const [data, setData] = useState({
    dureeMois: dureeInitialeMois,
    kmParMois: '',
    categorie: '',
    budgetMensuel: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    consent: false,
  });
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof data, v: string | boolean) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = async () => {
    if (sending) return;
    setSending(true);
    const res = await submitDevisLLD({ ...data, website });
    setSending(false);
    if (!res.success) {
      setErrors(res.errors);
      return;
    }
    setDone(true);
  };

  const e = (k: string) =>
    errors[k] ? <p className="text-[0.75rem] text-red-500 mt-1">{errors[k]}</p> : null;

  return (
    <section className="py-16 px-6" style={{ backgroundColor: '#F4EDE0' }}>
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5DDD3] p-8">
        {done ? (
          <div className="text-center">
            <CheckCircle className="text-[#52C88A] mx-auto mb-4" size={36} strokeWidth={1.5} />
            <p className="cp-title font-black text-cp-ink text-2xl mb-2">DEMANDE ENVOYÉE</p>
            <p className="text-sm text-cp-ink/55 leading-relaxed">
              Nous préparons votre devis longue durée et revenons vers vous sous 48 h (jours
              ouvrés).
            </p>
            <button onClick={onClose} className="mt-6 text-sm text-cp-mango hover:underline">
              Fermer
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                Longue durée · 30 jours et plus
              </p>
              <p className="cp-title font-black text-cp-ink text-xl">Devis personnalisé</p>
              <p className="text-xs text-cp-ink/40 mt-1">
                Tarif dégressif, contrat adapté, réponse sous 48 h. Le contrat longue durée est
                établi et signé à l&apos;agence.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-duree" className={lbl}>
                  Durée (mois) *
                </label>
                <input
                  id="lld-duree"
                  className={field}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={data.dureeMois}
                  onChange={(ev) => set('dureeMois', ev.target.value)}
                />
                {e('dureeMois')}
              </div>
              <div>
                <label htmlFor="lld-km" className={lbl}>
                  Km / mois (estimé)
                </label>
                <input
                  id="lld-km"
                  className={field}
                  type="number"
                  inputMode="numeric"
                  value={data.kmParMois}
                  onChange={(ev) => set('kmParMois', ev.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-cat" className={lbl}>
                  Catégorie
                </label>
                <select
                  id="lld-cat"
                  className={field}
                  value={data.categorie}
                  onChange={(ev) => set('categorie', ev.target.value)}
                >
                  <option value="">Indifférent</option>
                  {CATEGORIES.filter((c) => c !== 'Toutes').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lld-budget" className={lbl}>
                  Budget (€ / mois)
                </label>
                <input
                  id="lld-budget"
                  className={field}
                  type="number"
                  inputMode="decimal"
                  value={data.budgetMensuel}
                  onChange={(ev) => set('budgetMensuel', ev.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-prenom" className={lbl}>
                  Prénom *
                </label>
                <input
                  id="lld-prenom"
                  className={field}
                  type="text"
                  autoComplete="given-name"
                  value={data.prenom}
                  onChange={(ev) => set('prenom', ev.target.value)}
                />
                {e('prenom')}
              </div>
              <div>
                <label htmlFor="lld-nom" className={lbl}>
                  Nom *
                </label>
                <input
                  id="lld-nom"
                  className={field}
                  type="text"
                  autoComplete="family-name"
                  value={data.nom}
                  onChange={(ev) => set('nom', ev.target.value)}
                />
                {e('nom')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-email" className={lbl}>
                  Email *
                </label>
                <input
                  id="lld-email"
                  className={field}
                  type="email"
                  autoComplete="email"
                  value={data.email}
                  onChange={(ev) => set('email', ev.target.value)}
                />
                {e('email')}
              </div>
              <div>
                <label htmlFor="lld-tel" className={lbl}>
                  Téléphone *
                </label>
                <input
                  id="lld-tel"
                  className={field}
                  type="tel"
                  autoComplete="tel"
                  value={data.telephone}
                  onChange={(ev) => set('telephone', ev.target.value)}
                />
                {e('telephone')}
              </div>
            </div>
            {/* Honeypot anti-spam */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(ev) => setWebsite(ev.target.value)}
              style={{
                position: 'absolute',
                left: '-9999px',
                width: '1px',
                height: '1px',
                opacity: 0,
              }}
            />
            <div className="flex items-start gap-3">
              <input
                id="lld-consent"
                type="checkbox"
                checked={data.consent}
                onChange={(ev) => set('consent', ev.target.checked)}
                className="w-4 h-4 accent-cp-mango cursor-pointer mt-0.5 flex-shrink-0"
              />
              <label
                htmlFor="lld-consent"
                className="text-xs text-cp-ink/60 leading-relaxed cursor-pointer"
              >
                J&apos;accepte que mes données soient utilisées pour établir ce devis.
              </label>
            </div>
            {e('consent')}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-cp-ink/50 hover:text-cp-ink transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="flex-1 py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-red transition-colors disabled:opacity-60"
              >
                {sending ? 'Envoi…' : 'Demander mon devis'}
              </button>
            </div>
            <CpRgpdNotice className="mt-4" />
          </div>
        )}
      </div>
    </section>
  );
}
