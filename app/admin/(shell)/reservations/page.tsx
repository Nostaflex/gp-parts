import { redirect } from 'next/navigation';

import { requireAdminPage } from '@/lib/admin/auth';
import { getReservationsAdmin } from '@/lib/admin/reservations-server';

import { ReservationsClient } from './ReservationsClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réservations — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminReservationsPage() {
  // PII clients + lecture via Admin SDK (bypass rules) → vérif crypto admin
  // obligatoire ici (le middleware Edge ne contrôle que la présence du cookie).
  await requireAdminPage();

  const reservations = await getReservationsAdmin({ limit: 100 });

  return (
    <div className="p-4">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Réservations</h1>
      <ReservationsClient reservations={reservations} />
    </div>
  );
}
