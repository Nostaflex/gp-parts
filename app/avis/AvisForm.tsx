'use client';

import { useState, useTransition } from 'react';
import { submitAvis } from './actions';
import { AVIS_PRESTATIONS, AVIS_PRESTATION_LABEL } from '@/lib/avis';
import type { AvisPrestation } from '@/lib/avis';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';

const FIELD =
  'w-full h-12 px-4 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cp-mango/40';
const LABEL = 'block text-sm font-medium text-cp-ink mb-1';

export function AvisForm() {
  const [prenom, setPrenom] = useState('');
  const [note, setNote] = useState(0);
  const [texte, setTexte] = useState('');
  const [prestation, setPrestation] = useState<AvisPrestation>('reparation');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await submitAvis({ prenom, note, texte, prestation, email, website });
      if (res.ok) setSent(true);
      else setError(res.error);
    });
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5DDD3] p-8">
        <h2 className="cp-title font-black text-cp-ink text-2xl mb-3">Merci !</h2>
        <p className="text-cp-ink/70 text-sm leading-relaxed">
          Votre avis a bien été déposé. Il sera lu par notre équipe et publié après modération —
          nous ne publions ni ne modifions jamais un avis automatiquement.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="bg-white rounded-2xl border border-[#E5DDD3] p-6 sm:p-8 flex flex-col gap-5"
    >
      <div>
        <p className={LABEL}>Votre note *</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Note sur 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={note === n}
              aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              onClick={() => setNote(n)}
              className="h-12 w-12 text-3xl leading-none transition-transform hover:scale-110"
              style={{ color: n <= note ? '#E9C46A' : '#E5DDD3' }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={LABEL}>Prestation concernée *</p>
        <div className="flex flex-wrap gap-2">
          {AVIS_PRESTATIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrestation(p)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${prestation === p ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
            >
              {AVIS_PRESTATION_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="avis-prenom" className={LABEL}>
          Prénom (affiché avec votre avis) *
        </label>
        <input
          id="avis-prenom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className={FIELD}
          maxLength={40}
          autoComplete="given-name"
          required
        />
      </div>

      <div>
        <label htmlFor="avis-texte" className={LABEL}>
          Votre avis *
        </label>
        <textarea
          id="avis-texte"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={5}
          minLength={20}
          maxLength={800}
          className="w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cp-mango/40"
          required
        />
        <p className="text-xs text-cp-ink/40 mt-1">{texte.length}/800</p>
      </div>

      <div>
        <label htmlFor="avis-email" className={LABEL}>
          Email (jamais affiché — uniquement si nous devons vous recontacter)
        </label>
        <input
          id="avis-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
          autoComplete="email"
        />
      </div>

      {/* Honeypot anti-bot — invisible pour les humains */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error && (
        <p role="alert" className="text-sm font-medium" style={{ color: '#B85450' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || note === 0}
        className="self-start bg-cp-ink text-cp-cream text-sm font-semibold px-6 py-3 rounded-full hover:bg-cp-red transition-colors disabled:opacity-50"
      >
        {pending ? 'Envoi…' : 'Déposer mon avis'}
      </button>

      <CpRgpdNotice />
    </form>
  );
}
