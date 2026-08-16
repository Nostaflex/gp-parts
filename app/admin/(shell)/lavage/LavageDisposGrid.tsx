'use client';

import { useState } from 'react';
import { CRENEAUX_LAVAGE } from '@/lib/lavage-creneaux';
import { toggleLavageBlocage } from './actions';

import type { LavageBlocage } from '@/lib/lavage-creneaux';

/** Libellé court d'une date (mar. 18 août) — T12:00 pour neutraliser le fuseau. */
function labelJour(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

/**
 * Grille de disponibilités : bandeau de jours (défilement horizontal) +
 * les 7 créneaux du jour sélectionné. Tap = bloquer / libérer (manuel) ;
 * un créneau « Réservé » (posé depuis une demande) se libère après confirmation.
 */
export function LavageDisposGrid({
  dates,
  initial,
}: {
  dates: string[];
  initial: Record<string, LavageBlocage[]>;
}) {
  const [selected, setSelected] = useState(dates[0] ?? '');
  const [dispos, setDispos] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blocagesDe = (date: string) => dispos[date] ?? [];

  const toggle = async (creneau: string) => {
    const actuel = blocagesDe(selected).find((b) => b.creneau === creneau);
    if (
      actuel?.source === 'rdv' &&
      !window.confirm(`Libérer le créneau réservé « ${creneau} » du ${labelJour(selected)} ?`)
    )
      return;
    setPending(creneau);
    setError(null);
    const res = await toggleLavageBlocage(selected, creneau, !actuel);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDispos((d) => ({ ...d, [selected]: res.bloques }));
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      <div>
        <h2 className="text-body font-semibold" style={{ color: 'var(--text)' }}>
          Disponibilités
        </h2>
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Touche un créneau pour le bloquer ou le libérer — il devient indisponible sur le site. «
          Réservé » = posé depuis une demande de RDV.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {dates.map((date) => {
          const n = blocagesDe(date).length;
          const actif = date === selected;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              className="flex-shrink-0 h-11 px-3 rounded-[10px] border text-body-sm font-medium"
              style={{
                background: actif ? 'var(--blue)' : 'transparent',
                color: actif ? '#fff' : 'var(--text)',
                borderColor: actif ? 'var(--blue)' : 'var(--border)',
              }}
            >
              {labelJour(date)}
              {n > 0 && (
                <span
                  className="ml-1.5 text-caption font-semibold"
                  style={{ color: actif ? '#fff' : 'var(--orange)' }}
                >
                  {n}/{CRENEAUX_LAVAGE.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CRENEAUX_LAVAGE.map((creneau) => {
          const b = blocagesDe(selected).find((x) => x.creneau === creneau);
          const etat = b ? (b.source === 'rdv' ? 'Réservé' : 'Bloqué') : 'Libre';
          const couleur = b ? (b.source === 'rdv' ? 'var(--green)' : 'var(--orange)') : undefined;
          return (
            <button
              key={creneau}
              type="button"
              disabled={pending === creneau}
              onClick={() => toggle(creneau)}
              className="h-14 rounded-[10px] border text-body-sm font-medium flex flex-col items-center justify-center disabled:opacity-60"
              style={{
                background: couleur ?? 'transparent',
                color: b ? '#fff' : 'var(--text)',
                borderColor: couleur ?? 'var(--border)',
              }}
            >
              <span>{creneau}</span>
              <span
                className="text-caption"
                style={{ color: b ? '#fff' : 'var(--text-secondary)' }}
              >
                {pending === creneau ? '…' : etat}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-body-sm" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
