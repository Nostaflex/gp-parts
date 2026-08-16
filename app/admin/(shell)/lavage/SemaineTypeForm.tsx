'use client';

import { useActionState, useState } from 'react';
import { CRENEAUX_LAVAGE } from '@/lib/lavage-creneaux';
import { JOURS_ISO, NOMS_JOURS } from '@/lib/lavage-semaine';
import { updateSemaineType } from './actions';

import type { FormActionState } from '@/components/admin/FormShell';
import type { JourISO, SemaineType } from '@/lib/lavage-semaine';

/**
 * Semaine type : l'étage récurrent de la console (pattern Calendly
 * « Hours ») — un toggle par jour + les créneaux actifs ce jour-là.
 * Tout au tap, la grille d'exceptions se pose PAR-DESSUS.
 */
export function SemaineTypeForm({ initial }: { initial: SemaineType }) {
  const [semaine, setSemaine] = useState<SemaineType>(initial);
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateSemaineType,
    null
  );

  const toggleJour = (j: JourISO) =>
    setSemaine((s) => ({
      ...s,
      [j]: s[j].ouvert
        ? { ouvert: false, creneaux: [] }
        : // Ré-ouvrir un jour = tous les créneaux actifs (le cas courant).
          { ouvert: true, creneaux: [...CRENEAUX_LAVAGE] },
    }));

  const toggleCreneau = (j: JourISO, creneau: string) =>
    setSemaine((s) => {
      const ordre = CRENEAUX_LAVAGE as readonly string[];
      const actifs = s[j].creneaux.includes(creneau)
        ? s[j].creneaux.filter((c) => c !== creneau)
        : [...s[j].creneaux, creneau].sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b));
      return { ...s, [j]: { ouvert: actifs.length > 0, creneaux: actifs } };
    });

  const payload = JSON.stringify(semaine);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      <input type="hidden" name="semaineJson" value={payload} />
      <div>
        <h2 className="text-body font-semibold" style={{ color: 'var(--text)' }}>
          Semaine type
        </h2>
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Tes horaires récurrents : un jour fermé ici n&apos;est jamais réservable, semaine après
          semaine. Les blocages ponctuels se gèrent dans « Disponibilités ».
        </p>
      </div>

      {JOURS_ISO.map((j) => (
        <div
          key={j}
          className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0"
          style={{ borderColor: 'rgba(198, 198, 200, 0.35)' }}
        >
          <div className="flex items-center justify-between gap-3 min-h-11">
            <span className="text-body-sm font-semibold" style={{ color: 'var(--text)' }}>
              {NOMS_JOURS[j]}
              <span className="ml-2 font-normal" style={{ color: 'var(--text-secondary)' }}>
                {semaine[j].ouvert
                  ? semaine[j].creneaux.length === CRENEAUX_LAVAGE.length
                    ? 'tous les créneaux'
                    : `${semaine[j].creneaux.length} créneau${semaine[j].creneaux.length > 1 ? 'x' : ''}`
                  : 'fermé'}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={semaine[j].ouvert}
              aria-label={`${NOMS_JOURS[j]} ${semaine[j].ouvert ? 'ouvert' : 'fermé'}`}
              onClick={() => toggleJour(j)}
              className="relative h-7 w-12 flex-shrink-0 rounded-full transition-colors"
              style={{ background: semaine[j].ouvert ? 'var(--green)' : 'var(--border)' }}
            >
              <span
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                style={{ left: semaine[j].ouvert ? 'calc(100% - 26px)' : '2px' }}
              />
            </button>
          </div>
          {semaine[j].ouvert && (
            <div className="flex flex-wrap gap-1.5">
              {CRENEAUX_LAVAGE.map((c) => {
                const actif = semaine[j].creneaux.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => toggleCreneau(j, c)}
                    className="rounded-[8px] border px-2 py-1.5 text-caption font-medium"
                    style={{
                      background: actif ? 'var(--blue)' : 'transparent',
                      color: actif ? '#fff' : 'var(--text-secondary)',
                      borderColor: actif ? 'var(--blue)' : 'var(--border)',
                    }}
                  >
                    {c.slice(0, 5)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 h-11 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer la semaine type'}
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
