// Écritures publiques (formulaires) via Admin SDK — contourne les Security
// Rules. Les règles `demandes`/`reservations`/`orders` sont `create: if
// false` ; seules ces fonctions (côté serveur, après validation) écrivent.
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Demande, Order } from '@/lib/types';
import type { Reservation } from '@/lib/reservations';
import { orderSchema } from '@/lib/schemas/order';
import { ttlTimestamp } from '@/lib/server/ttl';

export async function createDemandeIntake(data: Omit<Demande, 'id'>): Promise<string> {
  // TTL natif : Firestore n'expire que des Timestamp (audit 2026-08-18).
  const ref = await getAdminFirestore()
    .collection('demandes')
    .add({ ...data, expiresAt: ttlTimestamp(data.expiresAt) });
  return ref.id;
}

export async function createReservationIntake(data: Omit<Reservation, 'id'>): Promise<string> {
  const ref = await getAdminFirestore()
    .collection('reservations')
    .add({ ...data, expiresAt: ttlTimestamp(data.expiresAt) });
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
export class StockInsuffisantError extends Error {
  constructor(
    public readonly productId: string,
    public readonly disponible: number
  ) {
    super(`Stock insuffisant pour ${productId} (${disponible} restant)`);
    this.name = 'StockInsuffisantError';
  }
}

export async function createOrderIntake(
  data: Omit<Order, 'id'>,
  idempotencyKey?: string
): Promise<OrderIntakeResult> {
  const parsed = orderSchema.omit({ id: true }).parse({
    ...data,
  });
  const db = getAdminFirestore();
  const orderRef = idempotencyKey
    ? db.collection('orders').doc(idempotencyKey)
    : db.collection('orders').doc();

  try {
    await db.runTransaction(async (tx) => {
      // 1) Lire TOUS les stocks dans la transaction (reads avant writes).
      const productRefs = parsed.items.map((it) => db.collection('products').doc(it.productId));
      const snaps = await Promise.all(productRefs.map((r) => tx.get(r)));

      // 2) Refus hors stock — plus jamais de « quantité forcée à 1 ».
      snaps.forEach((snap, i) => {
        const stock = snap.exists ? Number((snap.data() as { stock?: number }).stock ?? 0) : 0;
        if (stock < parsed.items[i].quantity) {
          throw new StockInsuffisantError(parsed.items[i].productId, stock);
        }
      });

      // 3) Décrément atomique + création : tout ou rien. Deux checkouts
      //    concurrents sur la dernière pièce → un seul commit passe.
      snaps.forEach((snap, i) => {
        tx.update(productRefs[i], {
          stock: Number((snap.data() as { stock?: number }).stock ?? 0) - parsed.items[i].quantity,
        });
      });
      tx.create(orderRef, parsed);
    });
    return { id: orderRef.id, existed: false };
  } catch (err) {
    if (err instanceof StockInsuffisantError) throw err;
    // gRPC ALREADY_EXISTS : la commande a déjà été créée avec la même clé —
    // la transaction ENTIÈRE a échoué, donc aucun double décrément de stock.
    if ((err as { code?: number }).code === 6) {
      const snap = await orderRef.get();
      const existing = snap.data() as Omit<Order, 'id'> | undefined;
      return {
        id: orderRef.id,
        existed: true,
        existingOrderNumber: existing?.orderNumber ?? '',
      };
    }
    throw err;
  }
}
