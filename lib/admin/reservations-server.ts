import { getAdminFirestore } from '@/lib/firebase-admin';
import { ttlMillis } from '@/lib/ttl';
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
  return snap.docs.map((d) => {
    const data = d.data();
    return parseReservation({ ...data, expiresAt: ttlMillis(data.expiresAt), id: d.id });
  });
}

export async function getReservationByIdAdmin(id: string): Promise<Reservation | null> {
  const snap = await getAdminFirestore().collection('reservations').doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  return parseReservation({ ...data, expiresAt: ttlMillis(data.expiresAt), id: snap.id });
}

export type TransitionResult =
  | { ok: true }
  | { ok: false; reason: 'introuvable' }
  | { ok: false; reason: 'transition'; current: ReservationStatus };

/**
 * Transition de statut TRANSACTIONNELLE : lecture + garde + écriture dans la
 * même transaction. Sans elle, deux admins (ou un double-clic) pouvaient
 * faire passer `nouvelle → confirmee` et `nouvelle → annulee` concurremment,
 * les deux gardes passant sur l'état lu avant l'autre écriture (TOCTOU).
 */
export async function transitionReservationStatusAdmin(
  id: string,
  status: ReservationStatus,
  allowed: Record<ReservationStatus, ReservationStatus[]>
): Promise<TransitionResult> {
  const db = getAdminFirestore();
  const ref = db.collection('reservations').doc(id);
  return db.runTransaction(async (tx): Promise<TransitionResult> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, reason: 'introuvable' };
    const current = (snap.data()?.status ?? 'nouvelle') as ReservationStatus;
    if (!allowed[current]?.includes(status)) {
      return { ok: false, reason: 'transition', current };
    }
    tx.update(ref, { status, updatedAt: new Date().toISOString() });
    return { ok: true };
  });
}
