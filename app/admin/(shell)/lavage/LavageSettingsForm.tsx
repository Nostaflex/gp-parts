'use client';

import { useActionState, useState } from 'react';
import { updateLavageSettings } from './actions';
import { htFromTTCEnCents, serializeFormulesForSave } from '@/lib/lavage-settings';
import type { LavageFormule, LavageSettings } from '@/lib/lavage-settings';
import type { FormActionState } from '@/components/admin/FormShell';
import { formatPrice } from '@/lib/utils';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-base text-[var(--text)] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

/** Ligne éditable — l'état vit côté client, sérialisé en JSON au submit. */
type Row = LavageFormule & { key: number };

export function LavageSettingsForm({ initial }: { initial: LavageSettings }) {
  const [rows, setRows] = useState<Row[]>(initial.formules.map((f, i) => ({ ...f, key: i })));
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateLavageSettings,
    null
  );

  const patch = (key: number, p: Partial<LavageFormule>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  const move = (key: number, dir: -1 | 1) =>
    setRows((rs) => {
      const i = rs.findIndex((r) => r.key === key);
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (key: number) => setRows((rs) => rs.filter((r) => r.key !== key));

  const add = () =>
    setRows((rs) => [
      ...rs,
      {
        key: Math.max(0, ...rs.map((r) => r.key)) + 1,
        nom: '',
        description: '',
        inclus: [],
        mode: 'devis',
        prixTTCEnCents: 0,
      },
    ]);

  // Payload : sans la clé locale `key`, lignes « inclus » nettoyées (une
  // ligne vide de textarea faisait refuser TOUT l'enregistrement).
  const payload = serializeFormulesForSave(rows.map(({ key: _key, ...f }) => f));

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      <input type="hidden" name="formulesJson" value={payload} />

      {rows.map((r, idx) => (
        <fieldset
          key={r.key}
          className="flex flex-col gap-3 rounded-[14px] p-5"
          style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <legend className="text-body-sm font-semibold" style={{ color: 'var(--text)' }}>
              Formule {idx + 1}
            </legend>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(r.key, -1)}
                disabled={idx === 0}
                aria-label={`Monter « ${r.nom || `formule ${idx + 1}`} »`}
                className="h-11 w-11 rounded-[10px] border disabled:opacity-30"
                style={{ color: 'var(--blue)', borderColor: 'var(--border)' }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(r.key, 1)}
                disabled={idx === rows.length - 1}
                aria-label={`Descendre « ${r.nom || `formule ${idx + 1}`} »`}
                className="h-11 w-11 rounded-[10px] border disabled:opacity-30"
                style={{ color: 'var(--blue)', borderColor: 'var(--border)' }}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Supprimer la formule « ${r.nom || `formule ${idx + 1}`} » ?`))
                    remove(r.key);
                }}
                className="h-11 px-3 rounded-[10px] border text-body-sm font-medium"
                style={{ color: 'var(--red)', borderColor: 'var(--border)' }}
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor={`nom-${r.key}`}>
                Nom (offre ou pack)
              </label>
              <input
                id={`nom-${r.key}`}
                value={r.nom}
                onChange={(e) => patch(r.key, { nom: e.target.value })}
                className={FIELD}
                maxLength={40}
                placeholder="Ex. Complet, Pack Intérieur + Extérieur…"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor={`desc-${r.key}`}>
                Description courte
              </label>
              <input
                id={`desc-${r.key}`}
                value={r.description}
                onChange={(e) => patch(r.key, { description: e.target.value })}
                className={FIELD}
                maxLength={200}
              />
            </div>
          </div>

          <div>
            <label className={LABEL} htmlFor={`inclus-${r.key}`}>
              Prestations incluses (une par ligne)
            </label>
            <textarea
              id={`inclus-${r.key}`}
              value={r.inclus.join('\n')}
              onChange={(e) =>
                patch(r.key, { inclus: e.target.value.split('\n').map((s) => s.trimStart()) })
              }
              rows={4}
              className={`${FIELD} h-auto py-2`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <p className={LABEL}>Tarification</p>
              <div
                className="grid grid-cols-2 gap-1 rounded-[10px] p-1 border"
                style={{ borderColor: 'var(--border)' }}
                role="radiogroup"
                aria-label="Mode de tarification"
              >
                {(['devis', 'prix'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={r.mode === m}
                    onClick={() => patch(r.key, { mode: m })}
                    className="h-9 rounded-[8px] text-body-sm font-semibold"
                    style={{
                      background: r.mode === m ? 'var(--blue)' : 'transparent',
                      color: r.mode === m ? '#fff' : 'var(--text)',
                    }}
                  >
                    {m === 'devis' ? 'Sur devis' : 'Prix affiché'}
                  </button>
                ))}
              </div>
            </div>
            {r.mode === 'prix' && (
              <div>
                <label className={LABEL} htmlFor={`prix-${r.key}`}>
                  Prix TTC (€)
                </label>
                <input
                  id={`prix-${r.key}`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={r.prixTTCEnCents === 0 ? '' : r.prixTTCEnCents / 100}
                  onChange={(e) =>
                    patch(r.key, { prixTTCEnCents: Math.round(Number(e.target.value || 0) * 100) })
                  }
                  className={FIELD}
                />
                {r.prixTTCEnCents > 0 && (
                  <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>
                    soit {formatPrice(htFromTTCEnCents(r.prixTTCEnCents))} HT (TVA 8,5 %)
                  </p>
                )}
              </div>
            )}
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={add}
        className="self-start h-11 px-4 rounded-[10px] border text-body-sm font-medium"
        style={{ color: 'var(--blue)', borderColor: 'var(--border)' }}
      >
        + Ajouter une formule
      </button>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 h-11 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer les formules'}
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
