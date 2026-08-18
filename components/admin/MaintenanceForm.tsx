'use client';

import { useActionState, useState } from 'react';
import { updateMaintenance } from '@/app/admin/(shell)/parametres/actions';
import type { MaintenanceConfig } from '@/lib/maintenance';
import type { FormActionState } from '@/components/admin/FormShell';

// Mode maintenance : un interrupteur + le texte affiché aux visiteurs.
// Le BO reste TOUJOURS accessible (le middleware exclut /admin).
export function MaintenanceForm({ initial }: { initial: MaintenanceConfig }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateMaintenance,
    null
  );
  const [enabled, setEnabled] = useState(initial.enabled);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[14px] p-5"
      style={{
        background: 'var(--surface)',
        border: enabled ? '1px solid var(--orange)' : '1px solid rgba(198, 198, 200, 0.5)',
      }}
    >
      <label className="flex items-center gap-3 text-body-sm" style={{ color: 'var(--text)' }}>
        <input
          type="checkbox"
          name="enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5"
          style={{ accentColor: 'var(--orange)' }}
        />
        <span className="font-medium">
          {enabled ? 'Site public EN MAINTENANCE' : 'Site public en ligne'}
        </span>
      </label>
      <p className="text-caption" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
        Activé : tous les visiteurs voient l&apos;écran d&apos;attente (non indexé par Google). Le
        back-office et les paiements Stripe continuent de fonctionner. Bascule en ≤ 30 s.
      </p>

      <label className="flex flex-col gap-1 text-body-sm" style={{ color: 'var(--text)' }}>
        <span>Titre affiché</span>
        <input
          name="titre"
          type="text"
          maxLength={80}
          defaultValue={initial.titre}
          className="rounded-[10px] px-3 py-2"
          style={{ border: '1px solid rgba(198, 198, 200, 0.6)' }}
        />
      </label>
      <label className="flex flex-col gap-1 text-body-sm" style={{ color: 'var(--text)' }}>
        <span>Message affiché</span>
        <textarea
          name="message"
          rows={3}
          maxLength={500}
          defaultValue={initial.message}
          className="rounded-[10px] px-3 py-2"
          style={{ border: '1px solid rgba(198, 198, 200, 0.6)' }}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: enabled ? 'var(--orange)' : 'var(--blue)' }}
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
          Vérifiez les champs (longueurs max : titre 80, message 500).
        </p>
      )}
    </form>
  );
}
