// Écritures publiques (formulaires) via Admin SDK — contourne les Security
// Rules. Les règles `demandes`/`reservations`/`orders` sont `create: if
// false` ; seules ces fonctions (côté serveur, après validation) écrivent.
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Demande, Order } from '@/lib/types';
import type { Reservation } from '@/lib/reservations';
import { orderSchema } from '@/lib/schemas/order';

export async function createDemandeIntake(data: Omit<Demande, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('demandes').add(data);
  return ref.id;
}

export async function createReservationIntake(data: Omit<Reservation, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('reservations').add(data);
  return ref.id;
}

export type OrderIntakeResult =
  | { id: string; existed: false }
  | { id: string; existed: true; existingOrderNumber: string };

/**
 * Création de commande via Admin SDK (audit 2026-08-18 : l'écriture SDK
 * client + règle `allow create` publique permettait spam et documents
 * malformés). Zod refuse les documents invalides AVANT écriture et STRIP
 * les champs inconnus. `idempotencyKey` (générée côté client au premier
 * clic) fait du doc id une clé : un double-clic ou un retry réseau ne crée
 * pas de seconde commande.
 */
export async function createOrderIntake(
  data: Omit<Order, 'id'>,
  idempotencyKey?: string
): Promise<OrderIntakeResult> {
  const parsed = orderSchema.omit({ id: true }).parse(data);
  const col = getAdminFirestore().collection('orders');

  if (!idempotencyKey) {
    const ref = await col.add(parsed);
    return { id: ref.id, existed: false };
  }

  const ref = col.doc(idempotencyKey);
  try {
    await ref.create(parsed);
    return { id: idempotencyKey, existed: false };
  } catch (err) {
    // gRPC ALREADY_EXISTS : la commande a déjà été créée par un appel
    // concurrent/antérieur avec la même clé — on la renvoie, sans doublon.
    if ((err as { code?: number }).code === 6) {
      const snap = await ref.get();
      const existing = snap.data() as Omit<Order, 'id'> | undefined;
      return {
        id: idempotencyKey,
        existed: true,
        existingOrderNumber: existing?.orderNumber ?? '',
      };
    }
    throw err;
  }
}
