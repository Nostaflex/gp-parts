'use client';

import { useState, useRef } from 'react';
import { CheckCircle, Upload, X } from 'lucide-react';

type Sujet = 'Renseignement' | 'Devis réparation' | 'Expertise' | 'Location' | 'Vente VO' | 'Autre';

type FormData = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  message: string;
  sujet: Sujet;
  files: File[];
  consent: boolean;
};

const SUJETS: Sujet[] = [
  'Renseignement',
  'Devis réparation',
  'Expertise',
  'Location',
  'Vente VO',
  'Autre',
];

const field =
  'w-full px-4 py-3 rounded-xl border border-cp-cream/20 bg-white/5 text-cp-cream placeholder:text-cp-cream/20 text-sm outline-none transition-all focus:border-cp-vert-l focus:ring-2 focus:ring-cp-vert-l/10';
const lbl = 'block text-xs font-semibold text-cp-vert-l/70 uppercase tracking-wider mb-1.5';

export function ContactForm() {
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    tel: '',
    message: '',
    sujet: 'Renseignement',
    files: [],
    consent: false,
  });

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    set('files', [...data.files, ...Array.from(fl)].slice(0, 5));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!data.prenom.trim()) errs.prenom = 'Prénom requis';
    if (!data.nom.trim()) errs.nom = 'Nom requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
    if (data.message.trim().length < 20) errs.message = 'Message requis (min. 20 caractères)';
    if (!data.consent) errs.consent = 'Consentement requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setDone(true);
  };

  const err = (k: keyof FormData) =>
    errors[k] ? <p className="text-[0.75rem] text-red-400 mt-1">{errors[k]}</p> : null;

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-12">
        <div className="w-16 h-16 rounded-full bg-cp-vert-l/15 border border-cp-vert-l/25 flex items-center justify-center mb-6">
          <CheckCircle className="text-cp-vert-l" size={28} strokeWidth={1.5} />
        </div>
        <p className="cp-mono text-xs text-cp-vert-l/50 tracking-widest uppercase mb-2">
          Message envoyé
        </p>
        <h3 className="cp-title font-black text-cp-cream text-3xl mb-3">ON VOUS RÉPOND !</h3>
        <p className="text-cp-cream/45 text-sm leading-relaxed mb-6 max-w-sm">
          Votre message a bien été reçu. Notre équipe vous répond dans la journée, souvent bien
          moins.
        </p>
        <button
          onClick={() => {
            setDone(false);
            setData({
              prenom: '',
              nom: '',
              email: '',
              tel: '',
              message: '',
              sujet: 'Renseignement',
              files: [],
              consent: false,
            });
          }}
          className="text-sm text-cp-vert-l hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="cp-title font-black text-cp-cream text-3xl mb-2">Écrivez-nous</h2>
      <p className="text-cp-cream/40 text-sm mb-6">
        Réponse garantie sous 24h — souvent bien moins.
      </p>

      {/* Chips sujet */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SUJETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => set('sujet', s)}
            className={`text-xs px-4 py-2 rounded-full border transition-all ${data.sujet === s ? 'bg-cp-vert-l border-cp-vert-l text-[#0E1F18] font-semibold' : 'border-cp-cream/15 text-cp-cream/45 hover:border-cp-vert-l/50 hover:text-cp-vert-l'}`}
          >
            {s}
          </button>
        ))}
      </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cemail" className={lbl}>
              Email *
            </label>
            <input
              id="cemail"
              className={field}
              type="email"
              autoComplete="email"
              placeholder="marie@exemple.fr"
              value={data.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {err('email')}
          </div>
          <div>
            <label htmlFor="ctel" className={lbl}>
              Téléphone
            </label>
            <input
              id="ctel"
              className={field}
              type="tel"
              autoComplete="tel"
              placeholder="+590 6XX XX XX XX"
              value={data.tel}
              onChange={(e) => set('tel', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className={lbl}>
            Message *
          </label>
          <textarea
            id="message"
            className={`${field} resize-none`}
            rows={5}
            placeholder="Décrivez votre besoin…"
            value={data.message}
            onChange={(e) => set('message', e.target.value)}
          />
          {err('message')}
        </div>

        {/* Upload */}
        <div>
          <p className={lbl}>
            Photos ou documents{' '}
            <span className="normal-case font-normal text-cp-cream/25 text-[0.65rem]">
              — Optionnel
            </span>
          </p>
          <div
            className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${dragging ? 'border-cp-vert-l bg-cp-vert-l/5' : 'border-cp-cream/15 hover:border-cp-vert-l/40'}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mx-auto mb-2 text-cp-cream/25" size={20} strokeWidth={1.5} />
            <p className="text-xs text-cp-cream/35">
              <strong className="text-cp-cream/50">Glissez vos fichiers</strong> ou cliquez
            </p>
            <p className="text-[0.65rem] text-cp-cream/25 mt-1">JPG, PNG, PDF · Max 5 Mo</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
          {data.files.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2">
              {data.files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-cp-cream/60 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'files',
                        data.files.filter((_, j) => j !== i)
                      )
                    }
                    className="text-cp-cream/30 hover:text-red-400 ml-2 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consentement */}
        <div className="flex items-start gap-3">
          <input
            id="consent"
            type="checkbox"
            checked={data.consent}
            onChange={(e) => set('consent', e.target.checked)}
            className="w-4 h-4 accent-cp-vert-l cursor-pointer mt-0.5 flex-shrink-0"
          />
          <label
            htmlFor="consent"
            className="text-xs text-cp-cream/40 leading-relaxed cursor-pointer"
          >
            J&apos;accepte que mes données soient utilisées pour traiter ma demande. Conformément au
            RGPD, vous pouvez exercer vos droits en nous contactant.
          </label>
        </div>
        {err('consent')}

        <button
          type="button"
          onClick={submit}
          className="w-full py-3.5 rounded-xl bg-cp-vert-l text-[#0E1F18] text-sm font-bold hover:bg-cp-vert-l/90 transition-colors"
        >
          Envoyer le message
        </button>
      </div>
    </div>
  );
}
