'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { localDateISO } from '@/lib/utils';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { submitLavage } from './actions';

type FormData = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  marque: string;
  modele: string;
  formule: string;
  date: string;
  creneau: string;
  message: string;
};

const CRENEAUX = [
  '08:00 – 09:00',
  '09:00 – 10:00',
  '10:00 – 11:00',
  '11:00 – 12:00',
  '14:00 – 15:00',
  '15:00 – 16:00',
  '16:00 – 17:00',
];

const EMPTY: FormData = {
  prenom: '',
  nom: '',
  email: '',
  tel: '',
  marque: '',
  modele: '',
  formule: '',
  date: '',
  creneau: '',
  message: '',
};

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-red focus:ring-2 focus:ring-cp-mango/10';
const label = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

export function LavageForm({
  formules,
  initialFormule = '',
}: {
  formules: string[];
  initialFormule?: string;
}) {
  const [website, setWebsite] = useState(''); // honeypot anti-spam
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [data, setData] = useState<FormData>({ ...EMPTY, formule: initialFormule });

  const set = (k: keyof FormData, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!data.prenom.trim()) errs.prenom = 'Prénom requis';
    if (!data.nom.trim()) errs.nom = 'Nom requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
    if (!/^[0-9\s\+]{8,}$/.test(data.tel)) errs.tel = 'Numéro invalide';
    if (!data.formule) errs.formule = 'Choisissez une formule';
    if (!data.date) errs.date = 'Date requise';
    if (!data.creneau) errs.creneau = 'Créneau requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitLavage({ ...data, website });
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
          Votre demande de lavage a bien été enregistrée. Notre équipe vous contacte sous 48h en
          jours ouvrés pour confirmer le créneau.
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
            setData({ ...EMPTY });
          }}
          className="mt-8 text-sm text-cp-mango hover:underline"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD3] p-8">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lav-prenom" className={label}>
              Prénom *
            </label>
            <input
              id="lav-prenom"
              className={field}
              autoComplete="given-name"
              value={data.prenom}
              onChange={(e) => set('prenom', e.target.value)}
            />
            {err('prenom')}
          </div>
          <div>
            <label htmlFor="lav-nom" className={label}>
              Nom *
            </label>
            <input
              id="lav-nom"
              className={field}
              autoComplete="family-name"
              value={data.nom}
              onChange={(e) => set('nom', e.target.value)}
            />
            {err('nom')}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lav-email" className={label}>
              Email *
            </label>
            <input
              id="lav-email"
              className={field}
              type="email"
              autoComplete="email"
              value={data.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {err('email')}
          </div>
          <div>
            <label htmlFor="lav-tel" className={label}>
              Téléphone *
            </label>
            <input
              id="lav-tel"
              className={field}
              type="tel"
              autoComplete="tel"
              placeholder="0690 …"
              value={data.tel}
              onChange={(e) => set('tel', e.target.value)}
            />
            {err('tel')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lav-marque" className={label}>
              Marque
            </label>
            <input
              id="lav-marque"
              className={field}
              placeholder="Peugeot"
              value={data.marque}
              onChange={(e) => set('marque', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lav-modele" className={label}>
              Modèle
            </label>
            <input
              id="lav-modele"
              className={field}
              placeholder="308"
              value={data.modele}
              onChange={(e) => set('modele', e.target.value)}
            />
          </div>
        </div>
        <div>
          <p className={label}>Formule *</p>
          <div className="flex flex-wrap gap-2">
            {formules.map((nom) => (
              <button
                key={nom}
                type="button"
                onClick={() => set('formule', nom)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${data.formule === nom ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
              >
                {nom}
              </button>
            ))}
          </div>
          {err('formule')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lav-date" className={label}>
              Date souhaitée *
            </label>
            <input
              id="lav-date"
              className={field}
              type="date"
              min={localDateISO(1)}
              value={data.date}
              onChange={(e) => set('date', e.target.value)}
            />
            {err('date')}
          </div>
          <div>
            <p className={label}>Créneau *</p>
            <select
              className={field}
              aria-label="Créneau horaire"
              value={data.creneau}
              onChange={(e) => set('creneau', e.target.value)}
            >
              <option value="">Choisir…</option>
              {CRENEAUX.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {err('creneau')}
          </div>
        </div>
        <div>
          <label htmlFor="lav-message" className={label}>
            Précisions (facultatif)
          </label>
          <textarea
            id="lav-message"
            className={`${field} resize-none`}
            rows={3}
            placeholder="État du véhicule, demandes particulières…"
            value={data.message}
            onChange={(e) => set('message', e.target.value)}
          />
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
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-cp-ink text-cp-cream text-sm font-bold hover:bg-cp-red transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Envoi…' : 'Demander mon créneau lavage'}
        </button>
        {submitError && (
          <p role="alert" className="text-sm text-red-600 text-center">
            {submitError}
          </p>
        )}
        <CpRgpdNotice />
      </div>
    </div>
  );
}
