'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { formatPrice } from '@/lib/utils';
import { updateReservationStatus } from '@/app/admin/reservations/actions';
import type { Reservation, ReservationStatus } from '@/lib/reservations';

const STATUS_LABEL: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  nouvelle: { label: 'Nouvelle', color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
  confirmee: { label: 'Confirmée', color: '#007AFF', bg: 'rgba(0,122,255,0.08)' },
  en_cours: { label: 'En cours', color: '#FF6B2C', bg: 'rgba(255,107,44,0.1)' },
  terminee: { label: 'Terminée', color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  annulee: { label: 'Annulée', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
};

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee'],
  terminee: [],
  annulee: [],
};

function Row({ reservation }: { reservation: Reservation }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ReservationStatus>(reservation.status);
  const [busy, setBusy] = useState(false);
  const cfg = STATUS_LABEL[status];

  const change = async (next: ReservationStatus) => {
    setBusy(true);
    const res = await updateReservationStatus(reservation.id, next);
    setBusy(false);
    if (res?.ok) {
      setStatus(next);
      showToast({ type: 'success', message: `Statut : ${STATUS_LABEL[next].label}` });
    } else {
      const msg =
        res && !res.ok && 'errors' in res ? (res.errors._form?.[0] ?? 'Erreur') : 'Erreur';
      showToast({ type: 'error', message: msg });
    }
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(198,198,200,0.5)' }} className="px-5 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="font-mono text-sm font-semibold" style={{ color: '#1C1C1E' }}>
            {reservation.reference}
          </span>
          <span
            className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.label}
          </span>
          <p className="text-sm mt-1" style={{ color: 'rgba(28,28,30,0.6)' }}>
            {reservation.carLabel} · {reservation.dateDepart} → {reservation.dateRetour} (
            {reservation.nbJours}j) · {formatPrice(reservation.totalEnCents)}
          </p>
          <p className="text-sm" style={{ color: 'rgba(28,28,30,0.6)' }}>
            {reservation.customer.prenom} {reservation.customer.nom} · {reservation.customer.email}{' '}
            · {reservation.customer.telephone} · permis {reservation.customer.permis}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {TRANSITIONS[status].map((next) => (
            <button
              key={next}
              type="button"
              disabled={busy}
              onClick={() => change(next)}
              className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{
                background: next === 'annulee' ? 'rgba(255,59,48,0.1)' : 'rgba(0,122,255,0.1)',
                color: next === 'annulee' ? '#FF3B30' : '#007AFF',
              }}
            >
              → {STATUS_LABEL[next].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReservationsClient({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) {
    return (
      <p className="px-5 py-16 text-center" style={{ color: 'rgba(28,28,30,0.6)' }}>
        Aucune réservation pour le moment.
      </p>
    );
  }
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid rgba(198,198,200,0.5)' }}
    >
      {reservations.map((r) => (
        <Row key={r.id} reservation={r} />
      ))}
    </div>
  );
}
