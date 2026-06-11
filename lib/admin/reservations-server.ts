import { getAdminFirestore } from '@/lib/firebase-admin';
import { parseReservation } from '@/lib/schemas/reservation';

import type { Reservation, ReservationStatus } from '@/lib/reservations';
import type { Query } from 'firebase-admin/firestore';

/**
 * Lectures / écritures `reservations` côté serveur via l'Admin SDK.
 *
 * Les Security Rules interdisent la lecture de la collection `reservations`
 * sans Firebase Auth (`isAdmin()`). Or le render serveur (Server Component,
 * Server Action) n'a pas de session Firebase Auth : le SDK client
 * (`getAdapter()`) tombe en `permission-denied` → 500.
 *
 * L'Admin SDK contourne les rules (privilèges service account). PII clients
 * (nom, email, téléphone, permis) → TOUJOURS appeler `requireAdmin()` en amont.
 */

export async function getReservationsAdmin(opts?: {
  status?: ReservationStatus;
  limit?: number;
}): Promise<Reservation[]> {
  const col = getAdminFirestore().collection('reservations');
  let q: Query = col.orderBy('createdAt', 'desc');
  if (opts?.status) {
    q = col.where('status', '==', opts.status).orderBy('createdAt', 'desc');
  }
  if (opts?.limit) q = q.limit(opts.limit);

  const snap = await q.get();
  return snap.docs.map((d) => parseReservation({ ...d.data(), id: d.id }));
}

export async function getReservationByIdAdmin(id: string): Promise<Reservation | null> {
  const snap = await getAdminFirestore().collection('reservations').doc(id).get();
  if (!snap.exists) return null;
  return parseReservation({ ...snap.data(), id: snap.id });
}

export async function updateReservationStatusAdmin(
  id: string,
  status: ReservationStatus
): Promise<void> {
  await getAdminFirestore()
    .collection('reservations')
    .doc(id)
    .update({ status, updatedAt: new Date().toISOString() });
}
