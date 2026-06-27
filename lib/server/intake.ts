// Écritures publiques (formulaires) via Admin SDK — contourne les Security
// Rules. Les règles `demandes`/`reservations` sont `create: if false` ; seules
// ces fonctions (côté serveur, après validation + honeypot) écrivent.
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Demande } from '@/lib/types';
import type { Reservation } from '@/lib/reservations';

export async function createDemandeIntake(data: Omit<Demande, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('demandes').add(data);
  return ref.id;
}

export async function createReservationIntake(data: Omit<Reservation, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('reservations').add(data);
  return ref.id;
}
