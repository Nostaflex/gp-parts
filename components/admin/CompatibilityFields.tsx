'use client';

import { useState } from 'react';

import type { VehicleCompatibility } from '@/lib/types';

const COMPAT_MAX = 50;

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';

const emptyRow = (): VehicleCompatibility => ({ brand: '', model: '', yearFrom: 0 });

export function CompatibilityFields({ initial }: { initial: VehicleCompatibility[] }) {
  const [rows, setRows] = useState<VehicleCompatibility[]>(
    initial.length > 0 ? initial : [emptyRow()]
  );

  function addRow() {
    if (rows.length >= COMPAT_MAX) return;
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof VehicleCompatibility, value: string) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        if (field === 'yearFrom' || field === 'yearTo') {
          const num = Number(value);
          if (field === 'yearTo') {
            return value === '' ? { ...row, yearTo: undefined } : { ...row, yearTo: num };
          }
          return { ...row, yearFrom: num };
        }
        return { ...row, [field]: value };
      })
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
          <input
            name={`compat_${idx}_brand`}
            placeholder="Marque"
            defaultValue={row.brand}
            onChange={(e) => updateRow(idx, 'brand', e.target.value)}
            className={FIELD}
          />
          <input
            name={`compat_${idx}_model`}
            placeholder="Modèle"
            defaultValue={row.model}
            onChange={(e) => updateRow(idx, 'model', e.target.value)}
            className={FIELD}
          />
          <input
            name={`compat_${idx}_yearFrom`}
            type="number"
            placeholder="Année début"
            defaultValue={row.yearFrom || ''}
            onChange={(e) => updateRow(idx, 'yearFrom', e.target.value)}
            className={FIELD}
          />
          <div className="flex gap-2">
            <input
              name={`compat_${idx}_yearTo`}
              type="number"
              placeholder="Année fin"
              defaultValue={row.yearTo ?? ''}
              onChange={(e) => updateRow(idx, 'yearTo', e.target.value)}
              className={`${FIELD} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="h-11 px-3 rounded-[10px] border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium"
              aria-label={`Supprimer la ligne ${idx + 1}`}
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        disabled={rows.length >= COMPAT_MAX}
        className="mt-1 h-9 px-4 rounded-[10px] border border-[var(--blue)] text-[var(--blue)] bg-[var(--surface)] text-body-sm font-medium hover:bg-[var(--blue-tint)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Ajouter compatibilité
      </button>
    </div>
  );
}
