'use client';

import { useActionState } from 'react';
import { updateLocationSettings } from '@/app/admin/(shell)/parametres/actions';
import type { LocationSettings } from '@/lib/location-settings';
import type { FormActionState } from '@/components/admin/FormShell';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-base text-[var(--text)] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

const CATEGORIES = ['Citadine', 'Berline', 'SUV', 'Utilitaire'] as const;

export function LocationSettingsForm({ initial }: { initial: LocationSettings }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateLocationSettings,
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="ageMinimum">
            Âge minimum (ans)
          </label>
          <input
            id="ageMinimum"
            name="ageMinimum"
            type="number"
            inputMode="numeric"
            min={18}
            defaultValue={initial.ageMinimum}
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="permisAncienneteMinAnnees">
            Ancienneté permis (ans)
          </label>
          <input
            id="permisAncienneteMinAnnees"
            name="permisAncienneteMinAnnees"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={initial.permisAncienneteMinAnnees}
            className={FIELD}
          />
        </div>
      </div>

      <label
        className="flex items-center justify-between gap-4 text-body-sm"
        style={{ color: 'var(--text)' }}
      >
        <span>Surcharge jeune conducteur (moins de {initial.surchargeJeuneAgeMax} ans)</span>
        <input
          type="checkbox"
          name="surchargeJeuneActive"
          defaultChecked={initial.surchargeJeuneActive}
          className="w-5 h-5 accent-[var(--blue)]"
        />
      </label>
      <div>
        <label className={LABEL} htmlFor="surchargeJeune">
          Montant surcharge (€ / jour)
        </label>
        <input
          id="surchargeJeune"
          name="surchargeJeune"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          defaultValue={initial.surchargeJeuneEnCentsParJour / 100}
          className={FIELD}
        />
      </div>

      <p className="text-body-sm font-medium" style={{ color: 'var(--text)' }}>
        Cautions par défaut (€) — utilisées quand la voiture n&apos;a pas de caution propre
      </p>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <label className={LABEL} htmlFor={`caution${cat}`}>
              {cat}
            </label>
            <input
              id={`caution${cat}`}
              name={`caution${cat}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              defaultValue={initial.cautionsParCategorieEnCents[cat] / 100}
              className={FIELD}
            />
          </div>
        ))}
      </div>

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
      {state && !state.ok && state.errors?._form && (
        <p role="alert" style={{ color: 'var(--red)' }}>
          {state.errors._form.join(' ')}
        </p>
      )}
    </form>
  );
}
