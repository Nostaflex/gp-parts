'use client';

import { useState, useRef } from 'react';
import { CheckCircle, Upload, X } from 'lucide-react';

type Step = 0 | 1 | 2;

type FormData = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  marque: string;
  modele: string;
  annee: string;
  km: string;
  motif: string;
  contexte: string;
  photos: File[];
  consent: boolean;
};

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
const MOTIFS = [
  "Achat véhicule d'occasion",
  'Dommages accidentels',
  'Litige assurance',
  'Expertise succession',
  'Contrôle avant vente',
  'Expertise judiciaire',
  'Autre',
];

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-mango focus:ring-2 focus:ring-cp-mango/10';
const lbl = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

function generateRef() {
  return `EXP-GP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function ExpertiseForm() {
  const [step, setStep] = useState<Step>(0);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    tel: '',
    marque: '',
    modele: '',
    annee: '',
    km: '',
    motif: '',
    contexte: '',
    photos: [],
    consent: false,
  });

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    set('photos', [...data.photos, ...valid].slice(0, 8));
  };

  const removePhoto = (i: number) => {
    set(
      'photos',
      data.photos.filter((_, idx) => idx !== i)
    );
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (step === 0) {
      if (!data.prenom.trim()) errs.prenom = 'Prénom requis';
      if (!data.nom.trim()) errs.nom = 'Nom requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
      if (!/^[0-9\s\+]{8,}$/.test(data.tel)) errs.tel = 'Numéro invalide';
      if (!data.marque) errs.marque = 'Marque requise';
      if (!data.modele.trim()) errs.modele = 'Modèle requis';
      if (!data.motif) errs.motif = 'Motif requis';
    }
    if (step === 1) {
      if (!data.contexte.trim()) errs.contexte = 'Description requise';
    }
    if (step === 2) {
      if (!data.consent) errs.consent = 'Consentement requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 2) {
      setRef(generateRef());
      setDone(true);
      return;
    }
    setStep((s) => (s + 1) as Step);
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
        <h3 className="cp-title font-black text-cp-ink text-3xl mb-3">EXPERTISE CONFIRMÉE</h3>
        <p className="text-cp-ink/55 text-sm leading-relaxed mb-6">
          Votre demande a bien été reçue. Un expert certifié vous contacte sous 24h pour fixer le
          rendez-vous d&apos;inspection.
        </p>
        <div className="bg-[#F8F5F0] rounded-xl px-6 py-4 mb-6">
          <p className="text-xs text-cp-ink/40 mb-1">Référence de votre dossier</p>
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
              km: '',
              motif: '',
              contexte: '',
              photos: [],
              consent: false,
            });
          }}
          className="mt-8 text-sm text-cp-mango hover:underline"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  const STEPS = ['Vos informations', 'Photos & contexte', 'Récapitulatif'];

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden">
      {/* Progress */}
      <div className="px-8 pt-8 pb-6 border-b border-[#F8F5F0]">
        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((s, i) => (
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
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#52C88A]' : 'bg-[#E5DDD3]'}`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-cp-ink/40">
          Étape {step + 1}/3 — <span className="text-cp-ink/70 font-medium">{STEPS[step]}</span>
        </p>
      </div>

      <div className="p-8">
        {/* Step 0 — Infos + Véhicule */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
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
                  value={data.prenom}
                  onChange={(e) => set('prenom', e.target.value)}
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
                  value={data.nom}
                  onChange={(e) => set('nom', e.target.value)}
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
                value={data.email}
                onChange={(e) => set('email', e.target.value)}
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
                value={data.tel}
                onChange={(e) => set('tel', e.target.value)}
              />
              {err('tel')}
            </div>

            <div className="border-t border-[#F8F5F0] pt-4">
              <p className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-3">
                Véhicule concerné
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="marque" className={lbl}>
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label htmlFor="modele" className={lbl}>
                      Modèle *
                    </label>
                    <input
                      id="modele"
                      className={field}
                      type="text"
                      placeholder="Clio, 308…"
                      value={data.modele}
                      onChange={(e) => set('modele', e.target.value)}
                    />
                    {err('modele')}
                  </div>
                  <div>
                    <label htmlFor="annee" className={lbl}>
                      Année
                    </label>
                    <input
                      id="annee"
                      className={field}
                      type="number"
                      placeholder="2020"
                      min={1990}
                      max={2026}
                      value={data.annee}
                      onChange={(e) => set('annee', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="km" className={lbl}>
                      Kilométrage
                    </label>
                    <input
                      id="km"
                      className={field}
                      type="number"
                      placeholder="45000"
                      min={0}
                      value={data.km}
                      onChange={(e) => set('km', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motif" className={lbl}>
                    Motif de l&apos;expertise *
                  </label>
                  <select
                    id="motif"
                    className={field}
                    value={data.motif}
                    onChange={(e) => set('motif', e.target.value)}
                  >
                    <option value="">Sélectionner un motif</option>
                    {MOTIFS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {err('motif')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Photos + contexte */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="contexte" className={lbl}>
                Décrivez le contexte *
              </label>
              <textarea
                id="contexte"
                className={`${field} resize-none`}
                rows={4}
                placeholder="Décrivez les dommages observés, la situation, ou les raisons de la demande d'expertise…"
                value={data.contexte}
                onChange={(e) => set('contexte', e.target.value)}
              />
              {err('contexte')}
            </div>

            <div>
              <p className={lbl}>
                Photos du véhicule <span className="normal-case font-normal">(jusqu&apos;à 8)</span>
              </p>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-cp-mango bg-cp-mango/5' : 'border-[#E5DDD3] hover:border-cp-mango/50'}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addPhotos(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 text-cp-ink/30" size={24} strokeWidth={1.5} />
                <p className="text-sm text-cp-ink/50">
                  Glissez vos photos ici ou{' '}
                  <span className="text-cp-mango font-medium">parcourir</span>
                </p>
                <p className="text-xs text-cp-ink/30 mt-1">JPG, PNG, WEBP — max 8 photos</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhotos(e.target.files)}
                />
              </div>

              {data.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {data.photos.map((f, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden bg-[#F8F5F0] group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-cp-ink/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Récap + consentement */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="bg-[#F8F5F0] rounded-xl p-5 text-sm">
              <p className="font-semibold text-cp-ink mb-3 text-xs uppercase tracking-wider">
                Récapitulatif de votre demande
              </p>
              <div className="flex flex-col gap-2 text-cp-ink/60 text-xs">
                <div className="flex justify-between">
                  <span className="text-cp-ink font-medium">Client</span>
                  <span>
                    {data.prenom} {data.nom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cp-ink font-medium">Contact</span>
                  <span>{data.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cp-ink font-medium">Véhicule</span>
                  <span>
                    {data.marque} {data.modele} {data.annee && `(${data.annee})`}{' '}
                    {data.km && `— ${parseInt(data.km).toLocaleString('fr-FR')} km`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cp-ink font-medium">Motif</span>
                  <span>{data.motif}</span>
                </div>
                {data.photos.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-cp-ink font-medium">Photos</span>
                    <span>
                      {data.photos.length} photo{data.photos.length > 1 ? 's' : ''} jointe
                      {data.photos.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#E5DDD3] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={data.consent}
                    onChange={(e) => set('consent', e.target.checked)}
                    className="w-4 h-4 accent-cp-mango cursor-pointer"
                  />
                </div>
                <label
                  htmlFor="consent"
                  className="text-xs text-cp-ink/60 leading-relaxed cursor-pointer"
                >
                  J&apos;accepte que mes données soient utilisées pour traiter ma demande
                  d&apos;expertise. Ces données ne seront jamais partagées avec des tiers.
                  Conformément au RGPD, vous pouvez exercer vos droits en nous contactant.
                </label>
              </div>
              {err('consent')}
            </div>

            <div className="bg-[#F4EDE0] border border-cp-mango/20 rounded-xl p-4 text-xs text-cp-ink/60">
              <p className="font-semibold text-cp-ink mb-1">Tarification</p>
              <p>
                À partir de <strong className="text-cp-mango">120 € TTC</strong> pour une expertise
                standard. Devis précis fourni lors de la prise de contact.
              </p>
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
            {step === 2 ? 'Envoyer ma demande' : 'Continuer'}
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
      </div>
    </div>
  );
}
