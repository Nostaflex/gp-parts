import { getAdapter } from '@/lib/data';

import { ReservationsClient } from './ReservationsClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réservations — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminReservationsPage() {
  const adapter = await getAdapter();
  const reservations = await adapter.getReservations({ limit: 100 });

  return (
    <div className="p-4">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Réservations</h1>
      <ReservationsClient reservations={reservations} />
    </div>
  );
}
