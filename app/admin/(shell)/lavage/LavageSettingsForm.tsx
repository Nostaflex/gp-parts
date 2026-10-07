'use client';

import { useActionState, useState } from 'react';
import { updateLavageSettings } from './actions';
import { htFromTTCEnCents, serializeFormulesForSave } from '@/lib/lavage-settings';
import type { LavageFormule, LavageNarration, LavageSettings } from '@/lib/lavage-settings';
import type { FormActionState } from '@/components/admin/FormShell';
import { formatPrice } from '@/lib/utils';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-base text-[var(--text)] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

/** Ligne éditable — l'état vit côté client, sérialisé en JSON au submit. */
type Row = LavageFormule & { key: number };

// Les 8 textes de la narration de Splash, dans l'ordre du parcours public.
const NARRATION_FIELDS: { k: keyof LavageNarration; label: string; aide?: string }[] = [
  { k: 'etape1', label: 'Étape 1 · La formule' },
  { k: 'etape2', label: 'Étape 2 · Le créneau (texte général)' },
  {
    k: 'etape2Rarete',
    label: 'Étape 2 · Quand il reste ≤ 2 créneaux',
    aide: '{restants} = nombre de créneaux libres · {jour} = le jour choisi',
  },
  {
    k: 'etape2Ferie',
    label: 'Étape 2 · Jour férié',
    aide: '{jour} = le jour · {ferie} = le nom du férié',
  },
  { k: 'etape3', label: 'Étape 3 · Les coordonnées' },
  { k: 'noteDefaut', label: 'Note du récap (par défaut)' },
  { k: 'noteSurDevis', label: 'Note du récap · formule sur devis' },
  { k: 'noteSuv', label: 'Note du récap · gabarit SUV' },
];

export function LavageSettingsForm({ initial }: { initial: LavageSettings }) {
  const [rows, setRows] = useState<Row[]>(initial.formules.map((f, i) => ({ ...f, key: i })));
  const [narration, setNarration] = useState<LavageNarration>(initial.narration);
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
        tarifs: [],
      },
    ]);

  const patchTarif = (key: number, i: number, p: Partial<LavageFormule['tarifs'][number]>) =>
    setRows((rs) =>
      rs.map((r) =>
        r.key === key
          ? { ...r, tarifs: r.tarifs.map((t, ti) => (ti === i ? { ...t, ...p } : t)) }
          : r
      )
    );

  const addTarif = (key: number) =>
    setRows((rs) =>
      rs.map((r) =>
        r.key === key ? { ...r, tarifs: [...r.tarifs, { label: '', prixTTCEnCents: 0 }] } : r
      )
    );

  const removeTarif = (key: number, i: number) =>
    setRows((rs) =>
      rs.map((r) => (r.key === key ? { ...r, tarifs: r.tarifs.filter((_, ti) => ti !== i) } : r))
    );

  // Payload : sans la clé locale `key`, lignes « inclus » nettoyées (une
  // ligne vide de textarea faisait refuser TOUT l'enregistrement).
  const payload = serializeFormulesForSave(rows.map(({ key: _key, ...f }) => f));

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      <input type="hidden" name="formulesJson" value={payload} />
      <input type="hidden" name="narrationJson" value={JSON.stringify(narration)} />

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

          <div>
            <p className={LABEL}>Tarifs par gabarit (aucun tarif → « Sur devis »)</p>
            <div className="flex flex-col gap-2">
              {r.tarifs.map((t, ti) => (
                <div key={ti} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      value={t.label}
                      onChange={(e) => patchTarif(r.key, ti, { label: e.target.value })}
                      className={FIELD}
                      maxLength={30}
                      placeholder="Citadine, Gamme B, SUV, Forfait…"
                      aria-label={`Gabarit du tarif ${ti + 1}`}
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={t.prixTTCEnCents === 0 ? '' : t.prixTTCEnCents / 100}
                      onChange={(e) =>
                        patchTarif(r.key, ti, {
                          prixTTCEnCents: Math.round(Number(e.target.value || 0) * 100),
                        })
                      }
                      className={FIELD}
                      placeholder="€ TTC"
                      aria-label={`Prix TTC (€) du tarif ${ti + 1}`}
                    />
                    {t.prixTTCEnCents > 0 && (
                      <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {formatPrice(htFromTTCEnCents(t.prixTTCEnCents))} HT
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTarif(r.key, ti)}
                    aria-label={`Supprimer le tarif « ${t.label || `tarif ${ti + 1}`} »`}
                    className="h-11 w-11 rounded-[10px] border"
                    style={{ color: 'var(--red)', borderColor: 'var(--border)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {r.tarifs.length < 6 && (
                <button
                  type="button"
                  onClick={() => addTarif(r.key)}
                  className="self-start h-9 px-3 rounded-[10px] border text-body-sm font-medium"
                  style={{ color: 'var(--blue)', borderColor: 'var(--border)' }}
                >
                  + Ajouter un tarif
                </button>
              )}
            </div>
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

      <fieldset
        className="flex flex-col gap-3 rounded-[14px] p-5"
        style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
      >
        <legend className="text-body-sm font-semibold" style={{ color: 'var(--text)' }}>
          Narration de Splash (parcours de réservation)
        </legend>
        <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>
          Ce que Splash dit à chaque étape sur la page /lavage. Vide un champ pour revenir au texte
          d&apos;origine.
        </p>
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
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 h-11 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer formules & narration'}
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
