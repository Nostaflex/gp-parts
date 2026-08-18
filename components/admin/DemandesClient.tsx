'use client';

import { useState } from 'react';
import { updateDemandeStatus, saveDemandeNote } from '@/app/admin/(shell)/demandes/actions';
import { reserveCreneauDemande } from '@/app/admin/(shell)/lavage/actions';
import type { Demande, DemandeStatus } from '@/lib/types';
import { joursRestantsRgpd, echeanceRgpd } from '@/lib/rgpd';

const STATUSES: { key: DemandeStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'nouvelle', label: 'Nouvelles' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'traitee', label: 'Traitées' },
];

const TYPE_LABEL: Record<string, string> = {
  contact: 'Contact',
  vehicule: 'Véhicule',
  moto: 'Moto',
  piece: 'Pièce',
  financement: 'Financement',
  reparation: 'Réparation',
  lavage: 'Lavage',
  location: 'Location LLD',
  rgpd: 'RGPD · droits',
};

export function DemandesClient({ demandes }: { demandes: Demande[] }) {
  const [filter, setFilter] = useState<DemandeStatus | 'all'>('all');
  const visible = demandes.filter(
    (d) => d.status !== 'deleted' && (filter === 'all' || d.status === filter)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(s.key)}
            className="rounded-[10px] px-3 py-1.5 text-body-sm"
            style={{
              background: filter === s.key ? 'var(--blue)' : 'var(--surface)',
              color: filter === s.key ? '#fff' : 'var(--text)',
              border: '1px solid rgba(198,198,200,0.5)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-body-sm" style={{ color: 'rgba(28,28,30,0.5)' }}>
          Aucune demande.
        </p>
      )}

      {visible.map((d) => (
        <DemandeRow key={d.id} d={d} />
      ))}
    </div>
  );
}

/** Réservation 1-tap du créneau porté par une demande lavage. Idempotent côté
 * serveur : re-réserver un créneau déjà posé le ré-écrit à l'identique — pas
 * besoin de connaître l'état au chargement. */
function CreneauActions({ d }: { d: Demande }) {
  const [etat, setEtat] = useState<'idle' | 'pending' | 'reserve' | 'libere'>('idle');

  const appliquer = async (bloquer: boolean) => {
    setEtat('pending');
    const res = await reserveCreneauDemande(d.id, bloquer);
    if (!res.ok) {
      setEtat('idle');
      window.alert(res.error);
      return;
    }
    setEtat(bloquer ? 'reserve' : 'libere');
  };

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <span className="text-body-sm" style={{ color: 'rgba(28,28,30,0.5)' }}>
        RDV {d.rdvDate} · {d.rdvCreneau}
      </span>
      <button
        type="button"
        disabled={etat === 'pending'}
        onClick={() => appliquer(true)}
        className="rounded-[10px] px-3 py-1.5 text-body-sm font-medium disabled:opacity-60"
        style={{
          background: etat === 'reserve' ? 'var(--green)' : 'var(--blue)',
          color: '#fff',
        }}
      >
        {etat === 'reserve' ? 'Créneau réservé ✓' : 'Réserver le créneau'}
      </button>
      <button
        type="button"
        disabled={etat === 'pending'}
        onClick={() => appliquer(false)}
        className="rounded-[10px] px-3 py-1.5 text-body-sm disabled:opacity-60"
        style={{ color: 'var(--red)', border: '1px solid rgba(198,198,200,0.6)' }}
      >
        {etat === 'libere' ? 'Créneau libéré' : 'Libérer'}
      </button>
    </div>
  );
}

function DemandeRow({ d }: { d: Demande }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(d.notes ?? '');

  // Un refus (conflit de lock, introuvable) doit être VISIBLE — jamais
  // silencieux (review C1). Toast propre au Lot 3 ; alert en attendant,
  // comme les tables catalogue.
  const applyStatus = async (status: DemandeStatus) => {
    const res = await updateDemandeStatus(d.id, status, d.updatedAt);
    if (!res.ok) window.alert(res.error);
  };

  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198,198,200,0.5)' }}
    >
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left">
        <span className="text-body-sm font-medium" style={{ color: 'var(--text)' }}>
          {d.nom}
        </span>
        <span className="text-body-sm" style={{ color: 'rgba(28,28,30,0.5)' }}>
          {' '}
          · {TYPE_LABEL[d.type] ?? d.type} · {new Date(d.createdAt).toLocaleDateString('fr-FR')} ·{' '}
          {d.status}
        </span>
        {d.type === 'rgpd' && d.status !== 'traitee' && (
          <span
            className="ml-2 rounded-full px-2 py-0.5 text-caption font-medium"
            style={
              joursRestantsRgpd(d.createdAt, Date.now()) <= 7
                ? { background: 'rgba(255,59,48,0.12)', color: 'var(--red)' }
                : { background: 'rgba(0,122,255,0.1)', color: 'var(--blue)' }
            }
          >
            {(() => {
              const j = joursRestantsRgpd(d.createdAt, Date.now());
              const lim = echeanceRgpd(d.createdAt).toLocaleDateString('fr-FR');
              return j < 0 ? `délai légal DÉPASSÉ (${lim})` : `à répondre avant le ${lim} (J-${j})`;
            })()}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 text-body-sm" style={{ color: 'var(--text)' }}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{d.message}</p>
          <div className="flex gap-4">
            <a href={`tel:${d.telephone}`} style={{ color: 'var(--blue)' }}>
              {d.telephone}
            </a>
            <a href={`mailto:${d.email}`} style={{ color: 'var(--blue)' }}>
              {d.email}
            </a>
          </div>
          {d.type === 'lavage' && d.rdvDate && d.rdvCreneau && <CreneauActions d={d} />}
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => applyStatus('en_cours')}>
              En cours
            </button>
            <button type="button" onClick={() => applyStatus('traitee')}>
              Traitée
            </button>
            <button type="button" onClick={() => applyStatus('deleted')}>
              Supprimer
            </button>
          </div>
          <form
            action={async () => {
              const res = await saveDemandeNote(d.id, note, d.updatedAt);
              if (!res.ok) window.alert(res.error);
            }}
            className="flex flex-col gap-2"
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Notes internes"
              className="rounded-[10px] p-2"
              style={{ border: '1px solid rgba(198,198,200,0.6)' }}
            />
            <button type="submit" className="self-start">
              Enregistrer la note
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
