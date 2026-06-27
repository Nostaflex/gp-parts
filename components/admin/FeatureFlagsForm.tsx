'use client';

import { useActionState } from 'react';
import { toggleFeatureFlags } from '@/app/admin/(shell)/parametres/actions';
import type { FeatureFlags } from '@/lib/feature-flags';
import type { FormActionState } from '@/components/admin/FormShell';

const SECTIONS: { key: keyof FeatureFlags; label: string }[] = [
  { key: 'pieces', label: 'Pièces (boutique)' },
  { key: 'location', label: 'Location' },
  { key: 'venteMoto', label: 'Vente moto' },
  { key: 'reparation', label: 'Réparation' },
];

export function FeatureFlagsForm({ initial }: { initial: FeatureFlags }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    toggleFeatureFlags,
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      {SECTIONS.map((s) => (
        <label
          key={s.key}
          className="flex items-center justify-between gap-4 text-body-sm"
          style={{ color: 'var(--text)' }}
        >
          <span>{s.label}</span>
          <input
            type="checkbox"
            name={s.key}
            defaultChecked={initial[s.key]}
            aria-label={s.label}
            className="w-5 h-5 accent-[var(--blue)]"
          />
        </label>
      ))}
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
    </form>
  );
}
