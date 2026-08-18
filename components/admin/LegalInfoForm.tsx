'use client';

import { useActionState } from 'react';
import { updateLegalInfo } from '@/app/admin/(shell)/parametres/actions';
import type { LegalInfo } from '@/lib/legal-info';
import type { FormActionState } from '@/components/admin/FormShell';

// Fiche d'identité légale (arbitrage A6) : tant qu'un champ est vide, la
// page /mentions-legales l'affiche en rouge « — à fournir ». Saisir la
// valeur ici la publie immédiatement.
const FIELDS: { name: keyof LegalInfo; label: string; placeholder: string }[] = [
  { name: 'tvaIntracom', label: 'N° TVA intracommunautaire', placeholder: 'FR XX 102854023' },
  {
    name: 'mediateurNom',
    label: 'Médiateur de la consommation (nom)',
    placeholder: 'ex. CM2C, Médiateur du commerce…',
  },
  { name: 'mediateurUrl', label: 'Médiateur — site (URL)', placeholder: 'https://…' },
  {
    name: 'rcPro',
    label: 'Assurance RC pro (assureur + n° de police)',
    placeholder: 'ex. AXA — police n° …',
  },
];

export function LegalInfoForm({ initial }: { initial: LegalInfo }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateLegalInfo,
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      {FIELDS.map((f) => (
        <label
          key={f.name}
          className="flex flex-col gap-1 text-body-sm"
          style={{ color: 'var(--text)' }}
        >
          <span>{f.label}</span>
          <input
            name={f.name}
            type="text"
            defaultValue={initial[f.name]}
            placeholder={f.placeholder}
            aria-label={f.label}
            className="rounded-[10px] px-3 py-2"
            style={{ border: '1px solid rgba(198, 198, 200, 0.6)' }}
          />
        </label>
      ))}
      <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
        Champ vide = affiché « — à fournir » sur la page légale. Jamais de zéros.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {state?.ok && (
        <p role="status" style={{ color: 'var(--green)' }}>
          {state.message}
        </p>
      )}
      {state && 'errors' in state && state.errors && (
        <p role="alert" style={{ color: 'var(--red)' }}>
          Vérifiez les champs (URL du médiateur, longueurs).
        </p>
      )}
    </form>
  );
}
