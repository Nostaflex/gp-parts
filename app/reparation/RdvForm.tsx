'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { localDateISO } from '@/lib/utils';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { submitRdv } from './actions';

type Step = 0 | 1 | 2 | 3;

type FormData = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  marque: string;
  modele: string;
  annee: string;
  immat: string;
  nature: string;
  type: string;
  roulable: string;
  sinistre: string;
  kilometrage: string;
  assurance: string;
  numAssure: string;
  description: string;
  date: string;
  creneau: string;
};

// Deux parcours distincts (retours Stéphane 2026-08-12) : une panne
// mécanique et un dégât de carrosserie ne se décrivent pas pareil.
const NATURES = [
  {
    id: 'mecanique',
    label: 'Panne / Mécanique',
    desc: 'Panne, entretien, voyant, bruit, comportement anormal…',
  },
  {
    id: 'carrosserie',
    label: 'Carrosserie',
    desc: 'Choc, rayure, bosse, peinture, remplacement d’élément…',
  },
];

const TYPES_MECANIQUE = [
  'Mécanique',
  'Électrique',
  'Vidange & entretien',
  'Freinage',
  'Climatisation',
  'Autre',
];

const ROULABLE = ['Oui', 'Non', 'Je ne sais pas'];
const SINISTRE = ['Oui, déclaré', 'En cours', 'Non / sans assurance'];
const CRENEAUX = [
  '08:00 – 09:00',
  '09:00 – 10:00',
  '10:00 – 11:00',
  '11:00 – 12:00',
  '14:00 – 15:00',
  '15:00 – 16:00',
  '16:00 – 17:00',
];
const MARQUES = [
  'Audi',
  'BMW',
  'Citroën',
  'Dacia',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Kia',
  'Mazda',
  'Mercedes',
  'Nissan',
  'Opel',
  'Peugeot',
  'Renault',
  'Seat',
  'Suzuki',
  'Toyota',
  'Volkswagen',
  'Yamaha',
  'Autre',
];

const STEP_LABELS = ['Vos coordonnées', 'Votre véhicule', 'Votre besoin', 'Date & créneau'];

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-red focus:ring-2 focus:ring-cp-mango/10';
const label = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

export function RdvForm() {
  const [step, setStep] = useState<Step>(0);
  const [website, setWebsite] = useState(''); // honeypot anti-spam
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [data, setData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    tel: '',
    marque: '',
    modele: '',
    annee: '',
    immat: '',
    nature: '',
    type: '',
    roulable: '',
    sinistre: '',
    kilometrage: '',
    assurance: '',
    numAssure: '',
    description: '',
    date: '',
    creneau: '',
  });

  const set = (k: keyof FormData, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (step === 0) {
      if (!data.prenom.trim()) errs.prenom = 'Prénom requis';
      if (!data.nom.trim()) errs.nom = 'Nom requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
      if (!/^[0-9\s\+]{8,}$/.test(data.tel)) errs.tel = 'Numéro invalide';
    }
    if (step === 1) {
      if (!data.marque) errs.marque = 'Marque requise';
      if (!data.modele.trim()) errs.modele = 'Modèle requis';
    }
    if (step === 2) {
      if (!data.nature) errs.nature = 'Choisissez la nature de votre besoin';
      if (data.nature === 'mecanique' && !data.type) errs.type = 'Type de prestation requis';
      if (data.nature === 'carrosserie') {
        // Réponse S2 Stéphane (2026-08-16) : plaque + kilométrage + assurance
        // + n° d'assuré suffisent pour le devis — pas de photos.
        if (!data.immat.trim()) errs.immat = 'Plaque requise pour générer votre véhicule';
        if (!data.kilometrage.trim()) errs.kilometrage = 'Kilométrage requis';
        if (!data.sinistre) errs.sinistre = 'Précisez la situation assurance';
        if (data.sinistre && data.sinistre !== 'Non / sans assurance') {
          if (!data.assurance.trim()) errs.assurance = 'Compagnie d’assurance requise';
          if (!data.numAssure.trim()) errs.numAssure = 'Numéro d’assuré requis';
        }
      }
      if (data.nature && !data.description.trim()) errs.description = 'Description requise';
    }
    if (step === 3) {
      if (!data.date) errs.date = 'Date requise';
      if (!data.creneau) errs.creneau = 'Créneau requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 3) {
      submit();
      return;
    }
    setStep((s) => (s + 1) as Step);
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitRdv({ ...data, website });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error);
      return;
    }
    setRef(res.ref);
    setEmailed(res.emailed);
    setDone(true);
  };

  const err = (k: keyof FormData) =>
    errors[k] ? <p className="text-[0.75rem] text-red-500 mt-1">{errors[k]}</p> : null;

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5DDD3] p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-[#52C88A]/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-[#52C88A]" size={32} strokeWidth={1.5} />
        </div>
        <p className="cp-mono text-xs text-cp-ink/35 tracking-widest uppercase mb-2">
          Demande envoyée
        </p>
        <h3 className="cp-title font-black text-cp-ink text-3xl mb-3">DEMANDE REÇUE</h3>
        <p className="text-cp-ink/55 text-sm leading-relaxed mb-6">
          Votre demande a bien été enregistrée. Notre équipe vous contacte sous 48h en jours ouvrés
          pour valider le créneau.
        </p>
        <div className="bg-[#F8F5F0] rounded-xl px-6 py-4 mb-6">
          <p className="text-xs text-cp-ink/40 mb-1">Référence de votre demande</p>
          <p className="cp-mono font-medium text-cp-ink text-lg tracking-wider">{ref}</p>
        </div>
        <p className="text-xs text-cp-ink/40">
          {emailed ? (
            <>
              Un email de confirmation a été envoyé à <strong>{data.email}</strong>.
            </>
          ) : (
            <>
              Nous vous recontactons sous 48h (jours ouvrés) au <strong>{data.tel}</strong>.
            </>
          )}
        </p>
        <button
          onClick={() => {
            setDone(false);
            setStep(0);
            setData({
              prenom: '',
              nom: '',
              email: '',
              tel: '',
              marque: '',
              modele: '',
              annee: '',
              immat: '',
              nature: '',
              type: '',
              roulable: '',
              sinistre: '',
              kilometrage: '',
              assurance: '',
              numAssure: '',
              description: '',
              date: '',
              creneau: '',
            });
          }}
          className="mt-8 text-sm text-cp-mango hover:underline"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden">
      {/* Progress */}
      <div className="px-8 pt-8 pb-6 border-b border-[#F8F5F0]">
        <div className="flex items-center gap-2 mb-4">
          {STEP_LABELS.map((lbl, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${i < step ? 'bg-[#52C88A] text-white' : i === step ? 'bg-cp-ink text-cp-cream' : 'bg-[#F8F5F0] text-cp-ink/30'}`}
              >
                {i < step ? (
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#52C88A]' : 'bg-[#E5DDD3]'}`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-cp-ink/40">
          Étape {step + 1}/4 —{' '}
          <span className="text-cp-ink/70 font-medium">{STEP_LABELS[step]}</span>
        </p>
      </div>

      <div className="p-8">
        {/* Step 0 — Coordonnées */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className={label}>
                  Prénom *
                </label>
                <input
                  id="prenom"
                  className={field}
                  type="text"
                  autoComplete="given-name"
                  placeholder="Marie"
                  value={data.prenom}
                  onChange={(e) => set('prenom', e.target.value)}
                />
                {err('prenom')}
              </div>
              <div>
                <label htmlFor="nom" className={label}>
                  Nom *
                </label>
                <input
                  id="nom"
                  className={field}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Dupont"
                  value={data.nom}
                  onChange={(e) => set('nom', e.target.value)}
                />
                {err('nom')}
              </div>
            </div>
            <div>
              <label htmlFor="email" className={label}>
                Email *
              </label>
              <input
                id="email"
                className={field}
                type="email"
                autoComplete="email"
                placeholder="marie.dupont@email.com"
                value={data.email}
                onChange={(e) => set('email', e.target.value)}
              />
              {err('email')}
            </div>
            <div>
              <label htmlFor="tel" className={label}>
                Téléphone *
              </label>
              <input
                id="tel"
                className={field}
                type="tel"
                autoComplete="tel"
                placeholder="0690 00 00 00"
                value={data.tel}
                onChange={(e) => set('tel', e.target.value)}
              />
              {err('tel')}
            </div>
          </div>
        )}

        {/* Step 1 — Véhicule */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="marque" className={label}>
                Marque *
              </label>
              <select
                id="marque"
                className={field}
                value={data.marque}
                onChange={(e) => set('marque', e.target.value)}
              >
                <option value="">Sélectionner une marque</option>
                {MARQUES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {err('marque')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="modele" className={label}>
                  Modèle *
                </label>
                <input
                  id="modele"
                  className={field}
                  type="text"
                  placeholder="Clio, 308, Yaris…"
                  value={data.modele}
                  onChange={(e) => set('modele', e.target.value)}
                />
                {err('modele')}
              </div>
              <div>
                <label htmlFor="annee" className={label}>
                  Année
                </label>
                <input
                  id="annee"
                  className={field}
                  type="number"
                  placeholder="2019"
                  min={1990}
                  max={2026}
                  value={data.annee}
                  onChange={(e) => set('annee', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="immat" className={label}>
                Immatriculation
              </label>
              <input
                id="immat"
                className={`${field} cp-mono tracking-widest`}
                type="text"
                placeholder="AB-123-CD"
                autoComplete="off"
                value={data.immat}
                onChange={(e) => set('immat', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Votre besoin : parcours distinct mécanique / carrosserie */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <p className={label}>Nature du besoin *</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NATURES.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      // Changer de nature réinitialise les champs de l'autre
                      // parcours — jamais de sinistre fantôme sur une vidange.
                      setData((d) => ({
                        ...d,
                        nature: n.id,
                        type: n.id === 'carrosserie' ? 'Carrosserie' : '',
                        roulable: '',
                        sinistre: '',
                        kilometrage: '',
                        assurance: '',
                        numAssure: '',
                      }));
                      setErrors((e) => ({ ...e, nature: undefined, type: undefined }));
                    }}
                    className={`text-left p-4 rounded-xl border transition-all ${data.nature === n.id ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink hover:border-cp-red'}`}
                  >
                    <p className="text-sm font-bold mb-1">{n.label}</p>
                    <p
                      className={`text-xs leading-relaxed ${data.nature === n.id ? 'text-cp-cream/60' : 'text-cp-ink/45'}`}
                    >
                      {n.desc}
                    </p>
                  </button>
                ))}
              </div>
              {err('nature')}
            </div>

            {data.nature === 'mecanique' && (
              <>
                <div>
                  <p className={label}>Type de prestation *</p>
                  <div className="flex flex-wrap gap-2">
                    {TYPES_MECANIQUE.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('type', t)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${data.type === t ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {err('type')}
                </div>
                <div>
                  <p className={label}>Le véhicule est-il roulable ?</p>
                  <div className="flex flex-wrap gap-2">
                    {ROULABLE.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => set('roulable', r)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${data.roulable === r ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="description" className={label}>
                    Décrivez le problème *
                  </label>
                  <textarea
                    id="description"
                    className={`${field} resize-none`}
                    rows={4}
                    placeholder="Symptômes observés : voyant allumé, bruit, à-coups, depuis quand…"
                    value={data.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                  {err('description')}
                </div>
              </>
            )}

            {data.nature === 'carrosserie' && (
              <>
                {/* Réponse S2 Stéphane (2026-08-16) : plaque + kilométrage +
                    assurance + n° d'assuré suffisent — pas de photos. La plaque
                    permet de générer le véhicule via le module d'estimation. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="immat-carrosserie" className={label}>
                      Immatriculation *
                    </label>
                    <input
                      id="immat-carrosserie"
                      className={`${field} cp-mono tracking-widest`}
                      type="text"
                      placeholder="AB-123-CD"
                      autoComplete="off"
                      value={data.immat}
                      onChange={(e) => set('immat', e.target.value.toUpperCase())}
                    />
                    {err('immat')}
                  </div>
                  <div>
                    <label htmlFor="kilometrage" className={label}>
                      Kilométrage *
                    </label>
                    <input
                      id="kilometrage"
                      className={field}
                      type="text"
                      inputMode="numeric"
                      placeholder="85 000"
                      value={data.kilometrage}
                      onChange={(e) => set('kilometrage', e.target.value)}
                    />
                    {err('kilometrage')}
                  </div>
                </div>
                <div>
                  <p className={label}>Sinistre déclaré à l&apos;assurance ? *</p>
                  <div className="flex flex-wrap gap-2">
                    {SINISTRE.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('sinistre', s)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${data.sinistre === s ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {err('sinistre')}
                </div>
                {data.sinistre && data.sinistre !== 'Non / sans assurance' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="assurance" className={label}>
                        Compagnie d&apos;assurance *
                      </label>
                      <input
                        id="assurance"
                        className={field}
                        type="text"
                        placeholder="GFA Caraïbes, Allianz…"
                        value={data.assurance}
                        onChange={(e) => set('assurance', e.target.value)}
                      />
                      {err('assurance')}
                    </div>
                    <div>
                      <label htmlFor="numAssure" className={label}>
                        Numéro d&apos;assuré *
                      </label>
                      <input
                        id="numAssure"
                        className={`${field} cp-mono`}
                        type="text"
                        autoComplete="off"
                        placeholder="A-123456"
                        value={data.numAssure}
                        onChange={(e) => set('numAssure', e.target.value)}
                      />
                      {err('numAssure')}
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="description" className={label}>
                    Décrivez les dégâts *
                  </label>
                  <textarea
                    id="description"
                    className={`${field} resize-none`}
                    rows={4}
                    placeholder="Zones touchées (aile avant droite, pare-chocs…), origine du choc, rayure ou déformation…"
                    value={data.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                  {err('description')}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Date & créneau */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="date" className={label}>
                Date souhaitée *
              </label>
              <input
                id="date"
                className={field}
                type="date"
                min={localDateISO(1)}
                value={data.date}
                onChange={(e) => set('date', e.target.value)}
              />
              {err('date')}
            </div>
            <div>
              <p className={label}>Créneau horaire *</p>
              <div className="grid grid-cols-2 gap-2">
                {CRENEAUX.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('creneau', c)}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${data.creneau === c ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {err('creneau')}
            </div>

            {/* Récap */}
            <div className="bg-[#F8F5F0] rounded-xl p-4 text-sm">
              <p className="font-semibold text-cp-ink mb-2 text-xs uppercase tracking-wider">
                Récapitulatif
              </p>
              <div className="flex flex-col gap-1 text-cp-ink/60 text-xs">
                <p>
                  <span className="text-cp-ink">Client :</span> {data.prenom} {data.nom}
                </p>
                <p>
                  <span className="text-cp-ink">Véhicule :</span> {data.marque} {data.modele}{' '}
                  {data.annee}
                </p>
                <p>
                  <span className="text-cp-ink">Prestation :</span>{' '}
                  {data.nature === 'carrosserie' ? 'Carrosserie' : data.type}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Honeypot anti-spam : invisible pour un humain, rempli par les bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1 py-3 rounded-xl border border-[#E5DDD3] text-sm font-medium text-cp-ink/60 hover:border-cp-red hover:text-cp-mango transition-colors"
            >
              Retour
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-red transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {step === 3 ? (submitting ? 'Envoi…' : 'Envoyer ma demande') : 'Continuer'}
            {step < 3 && (
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
        {submitError && (
          <p role="alert" className="text-sm text-red-600 mt-3 text-center">
            {submitError}
          </p>
        )}
        <CpRgpdNotice className="mt-4" />
      </div>
    </div>
  );
}
