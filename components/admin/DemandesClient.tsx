'use client';

import { useState } from 'react';
import { updateDemandeStatus, saveDemandeNote } from '@/app/admin/(shell)/demandes/actions';
import type { Demande, DemandeStatus } from '@/lib/types';

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
  location: 'Location LLD',
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

function DemandeRow({ d }: { d: Demande }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(d.notes ?? '');

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
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => updateDemandeStatus(d.id, 'en_cours')}>
              En cours
            </button>
            <button type="button" onClick={() => updateDemandeStatus(d.id, 'traitee')}>
              Traitée
            </button>
            <button type="button" onClick={() => updateDemandeStatus(d.id, 'deleted')}>
              Supprimer
            </button>
          </div>
          <form action={() => saveDemandeNote(d.id, note)} className="flex flex-col gap-2">
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
