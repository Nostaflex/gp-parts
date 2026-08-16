'use client';

import { useState } from 'react';
import { CRENEAUX_LAVAGE } from '@/lib/lavage-creneaux';
import { jourISOde } from '@/lib/lavage-semaine';
import { poserLavageConges, toggleLavageBlocage, toggleLavageJournee } from './actions';

import type { LavageBlocage } from '@/lib/lavage-creneaux';
import type { SemaineType } from '@/lib/lavage-semaine';

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
  feries = {},
  semaine,
}: {
  dates: string[];
  initial: Record<string, LavageBlocage[]>;
  /** Fériés Guadeloupe (date → libellé) — indication automatique, sans coût. */
  feries?: Record<string, string>;
  /** Semaine type : un jour fermé ici n'a pas besoin de blocages ponctuels. */
  semaine?: SemaineType;
}) {
  const [selected, setSelected] = useState(dates[0] ?? '');
  const [dispos, setDispos] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conges, setConges] = useState({ from: '', to: '' });

  const blocagesDe = (date: string) => dispos[date] ?? [];
  const fermeParSemaine = (date: string) => (semaine ? !semaine[jourISOde(date)].ouvert : false);

  const basculerJournee = async (bloquer: boolean) => {
    setPending('journee');
    setError(null);
    const res = await toggleLavageJournee(selected, bloquer);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDispos((d) => ({ ...d, [selected]: res.bloques }));
  };

  const poserConges = async () => {
    if (!conges.from || !conges.to) {
      setError('Choisis un début et une fin de congés.');
      return;
    }
    if (
      !window.confirm(
        `Bloquer toutes les journées du ${labelJour(conges.from)} au ${labelJour(conges.to)} ?`
      )
    )
      return;
    setPending('conges');
    setError(null);
    const res = await poserLavageConges(conges.from, conges.to);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // Re-synchronise les jours affichés couverts par la plage.
    setDispos((d) => {
      const next = { ...d };
      for (const date of dates) {
        if (date >= conges.from && date <= conges.to) {
          const rdv = (d[date] ?? []).filter((b) => b.source === 'rdv');
          next[date] = CRENEAUX_LAVAGE.map(
            (creneau) =>
              rdv.find((b) => b.creneau === creneau) ?? { creneau, source: 'manuel' as const }
          );
        }
      }
      return next;
    });
    setConges({ from: '', to: '' });
  };

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
              title={feries[date]}
              aria-label={`${labelJour(date)}${feries[date] ? ` (${feries[date]})` : ''}${fermeParSemaine(date) ? ', fermé' : ''}`}
              className="flex-shrink-0 h-11 px-3 rounded-[10px] border text-body-sm font-medium"
              style={{
                background: actif ? 'var(--blue)' : 'transparent',
                color: actif
                  ? '#fff'
                  : fermeParSemaine(date)
                    ? 'var(--text-secondary)'
                    : 'var(--text)',
                borderColor: actif ? 'var(--blue)' : 'var(--border)',
                opacity: !actif && fermeParSemaine(date) ? 0.6 : 1,
              }}
            >
              {labelJour(date)}
              {feries[date] && (
                <span aria-hidden="true" className="ml-1" style={{ color: 'var(--orange)' }}>
                  ●
                </span>
              )}
              {fermeParSemaine(date) ? (
                <span className="ml-1.5 text-caption font-semibold">fermé</span>
              ) : (
                n > 0 && (
                  <span
                    className="ml-1.5 text-caption font-semibold"
                    style={{ color: actif ? '#fff' : 'var(--orange)' }}
                  >
                    {n}/{CRENEAUX_LAVAGE.length}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>

      {feries[selected] && (
        <p className="text-body-sm" style={{ color: 'var(--orange)' }}>
          ● {feries[selected]}
        </p>
      )}
      {fermeParSemaine(selected) && (
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Jour fermé par la semaine type — rien à bloquer ici, gère-le dans « Semaine type ».
        </p>
      )}

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

      {/* Gestes rapides : journée entière + congés (pattern Fresha : en secondes) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => basculerJournee(true)}
          className="h-11 px-3 rounded-[10px] border text-body-sm font-medium disabled:opacity-60"
          style={{ color: 'var(--orange)', borderColor: 'var(--border)' }}
        >
          {pending === 'journee' ? '…' : 'Bloquer la journée'}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => basculerJournee(false)}
          className="h-11 px-3 rounded-[10px] border text-body-sm font-medium disabled:opacity-60"
          style={{ color: 'var(--blue)', borderColor: 'var(--border)' }}
        >
          Libérer la journée
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label
            htmlFor="conges-debut"
            className="block text-caption mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Congés — début
          </label>
          <input
            id="conges-debut"
            type="date"
            value={conges.from}
            min={dates[0]}
            onChange={(e) => setConges((c) => ({ ...c, from: e.target.value }))}
            className="h-11 px-3 rounded-[10px] border text-body-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          />
        </div>
        <div>
          <label
            htmlFor="conges-fin"
            className="block text-caption mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Fin
          </label>
          <input
            id="conges-fin"
            type="date"
            value={conges.to}
            min={conges.from || dates[0]}
            onChange={(e) => setConges((c) => ({ ...c, to: e.target.value }))}
            className="h-11 px-3 rounded-[10px] border text-body-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          />
        </div>
        <button
          type="button"
          disabled={pending !== null}
          onClick={poserConges}
          className="h-11 px-3 rounded-[10px] border text-body-sm font-medium disabled:opacity-60"
          style={{ color: 'var(--red)', borderColor: 'var(--border)' }}
        >
          {pending === 'conges' ? '…' : 'Poser des congés'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-body-sm" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
