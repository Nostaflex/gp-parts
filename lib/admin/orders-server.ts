import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { parseOrder } from '@/lib/schemas/order';
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types';

/**
 * Lecture/écriture admin des commandes via l'Admin SDK — contourne les
 * Firestore rules (`orders`: read/update réservés à isAdmin()). Nécessaire
 * côté serveur : le SDK client n'a pas de session authentifiée → il serait
 * refusé (permission-denied). Miroir de demandes-server. TOUJOURS appeler
 * requireAdmin() en amont pour les routes admin (le webhook Stripe est
 * authentifié par la signature, pas par requireAdmin).
 */

// Timestamp Admin/Client → ISO (duck-typé : les deux exposent .toDate()).
function toISO(v: unknown): unknown {
  if (v && typeof (v as { toDate?: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return v;
}

function docToOrder(id: string, data: Record<string, unknown>): Order {
  return parseOrder({
    ...data,
    id,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  });
}

export async function getOrdersAdmin(opts?: {
  status?: OrderStatus;
  limit?: number;
  /** Borne basse sur createdAt (Timestamp Firestore) — ex. début du mois pour le dashboard. */
  since?: Date;
}): Promise<Order[]> {
  let q = getAdminFirestore().collection('orders').orderBy('createdAt', 'desc');
  if (opts?.status) q = q.where('status', '==', opts.status) as typeof q;
  if (opts?.since) q = q.where('createdAt', '>=', opts.since) as typeof q;
  if (opts?.limit) q = q.limit(opts.limit) as typeof q;
  const snap = await q.get();
  return snap.docs.map((d) => docToOrder(d.id, d.data() as Record<string, unknown>));
}

export async function getOrderByIdAdmin(id: string): Promise<Order | null> {
  const snap = await getAdminFirestore().collection('orders').doc(id).get();
  if (!snap.exists) return null;
  return docToOrder(id, snap.data() as Record<string, unknown>);
}

/**
 * Règlement TRANSACTIONNEL du paiement (audit 2026-08-18) : le check-then-act
 * « déjà paid ? » vivait hors transaction — deux traitements concurrents du
 * même paiement pouvaient tous deux passer et envoyer deux emails. Ici le
 * test et l'écriture sont atomiques : un seul appelant obtient 'applied'.
 */
export async function settlePaymentAdmin(
  id: string,
  patch: { paymentStatus: PaymentStatus; stripePaymentIntentId?: string }
): Promise<'applied' | 'already' | 'not_found'> {
  const db = getAdminFirestore();
  const ref = db.collection('orders').doc(id);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return 'not_found';
    if ((snap.data() as Order).paymentStatus === patch.paymentStatus) return 'already';
    const update: Record<string, unknown> = {
      paymentStatus: patch.paymentStatus,
      updatedAt: new Date().toISOString(),
    };
    if (patch.stripePaymentIntentId) update.stripePaymentIntentId = patch.stripePaymentIntentId;
    tx.update(ref, update);
    return 'applied';
  });
}

export async function updateOrderStatusAdmin(id: string, status: OrderStatus): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection('orders').doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const order = snap.data() as Order;
    // Annulation : le stock décrémenté au checkout REVIENT tout seul
    // (décision Djemil 2026-08-18). Garde anti-double-restock : seulement
    // au premier passage vers 'annulee'.
    if (status === 'annulee' && order.status !== 'annulee') {
      for (const item of order.items ?? []) {
        tx.update(db.collection('products').doc(item.productId), {
          stock: FieldValue.increment(item.quantity),
        });
      }
    }
    tx.update(ref, { status, updatedAt: new Date().toISOString() });
  });
}
