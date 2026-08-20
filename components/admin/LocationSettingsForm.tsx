'use client';

import { useActionState, useState } from 'react';
import { updateLocationSettings } from '@/app/admin/(shell)/parametres/actions';
import type { LocationNarration, LocationSettings } from '@/lib/location-settings';
import type { FormActionState } from '@/components/admin/FormShell';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-base text-[var(--text)] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

const CATEGORIES = ['Citadine', 'Berline', 'SUV', 'Utilitaire'] as const;

// Les 16 textes de la narration de Max, dans l'ordre du parcours public.
const NARRATION_FIELDS: { k: keyof LocationNarration; label: string; aide?: string }[] = [
  { k: 'acte1SansDepart', label: 'Acte 1 · avant le choix du départ' },
  { k: 'acte1VoeuSansDepart', label: 'Acte 1 · véhicule épinglé', aide: '{vehicule}' },
  { k: 'acte1ChoixRetour', label: 'Acte 1 · choix du retour', aide: '{depart}' },
  { k: 'acte1CorrectionDepart', label: 'Acte 1 · correction du départ' },
  { k: 'acte1Complet', label: 'Acte 1 · plage posée', aide: '{jours}' },
  { k: 'acte1LongSejour', label: 'Acte 1 · séjour de 7 jours et plus', aide: '{jours}' },
  {
    k: 'acte1PlageMorte',
    label: 'Acte 1 · aucun véhicule sur la plage',
    aide: '{depart} · {retour}',
  },
  {
    k: 'acte1Carrefour',
    label: 'Acte 1 · véhicule épinglé pris, alternative trouvée',
    aide: '{vehicule} · {depart} · {retour} · {alternative}',
  },
  {
    k: 'acte1CarrefourSansAlt',
    label: 'Acte 1 · épinglé pris, aucune alternative',
    aide: '{vehicule}',
  },
  { k: 'acte2', label: 'Acte 2 · général', aide: '{depart}' },
  { k: 'acte2Rarete', label: 'Acte 2 · il reste ≤ 2 véhicules', aide: '{dispo}' },
  { k: 'acte2VoeuPris', label: 'Acte 2 · véhicule épinglé pris', aide: '{vehicule}' },
  { k: 'acte3', label: 'Acte 3 · le conducteur' },
  { k: 'noteDefaut', label: 'Note du récap (par défaut)' },
  { k: 'noteUtilitaire', label: 'Note du récap · utilitaire' },
  { k: 'noteLongue', label: 'Note du récap · 5 jours et plus' },
];

export function LocationSettingsForm({ initial }: { initial: LocationSettings }) {
  const [narration, setNarration] = useState<LocationNarration>(initial.narration);
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

      <input type="hidden" name="narrationJson" value={JSON.stringify(narration)} />
      <details className="rounded-[12px] border p-4" style={{ borderColor: 'var(--border)' }}>
        <summary
          className="cursor-pointer text-body-sm font-semibold"
          style={{ color: 'var(--text)' }}
        >
          Narration de Max (parcours de réservation Loca Lane)
        </summary>
        <p className="text-caption mt-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
          Ce que Max dit à chaque moment du parcours /location. Les mots entre accolades sont
          remplacés automatiquement. Vide un champ pour revenir au texte d&apos;origine.
        </p>
        <div className="flex flex-col gap-3">
          {NARRATION_FIELDS.map(({ k, label, aide }) => (
            <div key={k}>
              <label className={LABEL} htmlFor={`narr-${k}`}>
                {label}
              </label>
              <textarea
                id={`narr-${k}`}
                value={narration[k]}
                onChange={(e) => setNarration((n) => ({ ...n, [k]: e.target.value }))}
                rows={2}
                maxLength={300}
                className={`${FIELD} h-auto py-2`}
              />
              {aide && (
                <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {aide}
                </p>
              )}
            </div>
          ))}
        </div>
      </details>

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
