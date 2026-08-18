// Lecture de disponibilité via Admin SDK : les rules `reservations` sont
// admin-only (leçon prod #41 — jamais le SDK client côté serveur public).
// Sortie sans PII : uniquement des plages de dates / IDs de voitures.
// Fail-open + WARN : la dispo est un pré-filtre best-effort, la confirmation
// humaine de chaque réservation reste la vraie barrière.
import { getAdminFirestore } from '@/lib/firebase-admin';
import { BLOCKING_STATUSES, rangesOverlap } from '@/lib/reservations';
import type { Reservation } from '@/lib/reservations';

export type BusyRange = { dateDepart: string; dateRetour: string };

export async function getBusyRangesForCar(carId: string): Promise<BusyRange[]> {
  try {
    const snap = await getAdminFirestore()
      .collection('reservations')
      .where('locationCarId', '==', carId)
      .get();
    return snap.docs
      .map((d) => d.data() as Pick<Reservation, 'status' | 'dateDepart' | 'dateRetour'>)
      .filter((r) => BLOCKING_STATUSES.includes(r.status))
      .map((r) => ({ dateDepart: r.dateDepart, dateRetour: r.dateRetour }));
  } catch (err) {
    console.warn('[availability] lecture réservations échouée (fail-open):', err);
    return [];
  }
}

export type CarBusyRange = BusyRange & { locationCarId: string };

/** Toutes les plages bloquantes du parc en UNE lecture — pour la bande de
 * 6 jours du Pit Lane (compter par jour sans relire Firestore 6 fois). */
export async function getAllBusyRanges(): Promise<CarBusyRange[]> {
  try {
    const snap = await getAdminFirestore()
      .collection('reservations')
      .where('status', 'in', BLOCKING_STATUSES)
      .get();
    return snap.docs.map((d) => {
      const r = d.data() as Pick<Reservation, 'locationCarId' | 'dateDepart' | 'dateRetour'>;
      return { locationCarId: r.locationCarId, dateDepart: r.dateDepart, dateRetour: r.dateRetour };
    });
  } catch (err) {
    console.warn('[availability] lecture réservations échouée (fail-open):', err);
    return [];
  }
}

export async function getUnavailableCarIds(
  dateDepart: string,
  dateRetour: string
): Promise<string[]> {
  try {
    const snap = await getAdminFirestore()
      .collection('reservations')
      .where('status', 'in', BLOCKING_STATUSES)
      .get();
    const ids = snap.docs
      .map((d) => d.data() as Pick<Reservation, 'locationCarId' | 'dateDepart' | 'dateRetour'>)
      .filter((r) => rangesOverlap(dateDepart, dateRetour, r.dateDepart, r.dateRetour))
      .map((r) => r.locationCarId);
    return [...new Set(ids)];
  } catch (err) {
    console.warn('[availability] lecture réservations échouée (fail-open):', err);
    return [];
  }
}
