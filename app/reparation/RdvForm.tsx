'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

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
  type: string;
  description: string;
  date: string;
  creneau: string;
};

const TYPES = [
  'Mécanique',
  'Carrosserie',
  'Électrique',
  'Vidange & entretien',
  'Freinage',
  'Climatisation',
  'Autre',
];
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

const STEP_LABELS = ['Vos coordonnées', 'Votre véhicule', 'La prestation', 'Date & créneau'];

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-mango focus:ring-2 focus:ring-cp-mango/10';
const label = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

function generateRef() {
  return `RDV-CP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function RdvForm() {
  const [step, setStep] = useState<Step>(0);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
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
    type: '',
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
      if (!data.type) errs.type = 'Type de prestation requis';
      if (!data.description.trim()) errs.description = 'Description requise';
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

  const submit = () => {
    setRef(generateRef());
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
        <h3 className="cp-title font-black text-cp-ink text-3xl mb-3">RDV CONFIRMÉ</h3>
        <p className="text-cp-ink/55 text-sm leading-relaxed mb-6">
          Votre demande a bien été enregistrée. Nous vous contactons sous 1h pour valider le
          créneau.
        </p>
        <div className="bg-[#F8F5F0] rounded-xl px-6 py-4 mb-6">
          <p className="text-xs text-cp-ink/40 mb-1">Référence de votre demande</p>
          <p className="cp-mono font-medium text-cp-ink text-lg tracking-wider">{ref}</p>
        </div>
        <p className="text-xs text-cp-ink/40">
          Un email de confirmation a été envoyé à <strong>{data.email}</strong>
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
              type: '',
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

        {/* Step 2 — Prestation */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <p className={label}>Type de prestation *</p>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${data.type === t ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-mango hover:text-cp-mango'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {err('type')}
            </div>
            <div>
              <label htmlFor="description" className={label}>
                Décrivez le problème *
              </label>
              <textarea
                id="description"
                className={`${field} resize-none`}
                rows={4}
                placeholder="Décrivez le symptôme ou la panne observée…"
                value={data.description}
                onChange={(e) => set('description', e.target.value)}
              />
              {err('description')}
            </div>
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
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
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
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${data.creneau === c ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-mango hover:text-cp-mango'}`}
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
                  <span className="text-cp-ink">Prestation :</span> {data.type}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1 py-3 rounded-xl border border-[#E5DDD3] text-sm font-medium text-cp-ink/60 hover:border-cp-mango hover:text-cp-mango transition-colors"
            >
              Retour
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="flex-1 py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-mango transition-colors flex items-center justify-center gap-2"
          >
            {step === 3 ? 'Envoyer ma demande' : 'Continuer'}
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
      </div>
    </div>
  );
}
