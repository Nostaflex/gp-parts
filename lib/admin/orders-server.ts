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
  /** Borne basse sur createdAt — ex. début du mois pour le dashboard. */
  since?: Date;
}): Promise<Order[]> {
  let q = getAdminFirestore().collection('orders').orderBy('createdAt', 'desc');
  if (opts?.status) q = q.where('status', '==', opts.status) as typeof q;
  // Borne au format ÉCRIT (texte ISO, checkout Admin SDK depuis le 18/08) :
  // Firestore ne compare que des valeurs de même type, une Date ne trouvait
  // aucune commande (analyse BO du 18/10, F3). Les commandes antérieures au
  // 18/08 (Timestamp) sont hors de toute borne de mois postérieure.
  if (opts?.since) q = q.where('createdAt', '>=', opts.since.toISOString()) as typeof q;
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

/** Transitions autorisées — miroir de STATUS_TRANSITIONS côté client. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['preparation', 'annulee'],
  preparation: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

export type OrderTransitionResult =
  | { ok: true }
  | { ok: false; reason: 'introuvable' }
  | { ok: false; reason: 'transition'; current: OrderStatus };

/**
 * Transition de statut TRANSACTIONNELLE : lecture + garde + écriture dans la
 * même transaction, comme transitionReservationStatusAdmin. Lue hors
 * transaction, la garde laissait deux onglets (ou un double clic) agir sur un
 * statut déjà changé — y compris une annulation qui remet du stock
 * (analyse BO du 18/10, F6).
 */
export async function updateOrderStatusAdmin(
  id: string,
  status: OrderStatus
): Promise<OrderTransitionResult> {
  const db = getAdminFirestore();
  const ref = db.collection('orders').doc(id);
  return db.runTransaction(async (tx): Promise<OrderTransitionResult> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, reason: 'introuvable' };
    const order = snap.data() as Order;
    if (!ORDER_TRANSITIONS[order.status]?.includes(status)) {
      return { ok: false, reason: 'transition', current: order.status };
    }
    // Annulation : le stock décrémenté au checkout REVIENT tout seul
    // (décision Djemil 2026-08-18). Une seule fois : aucune transition ne
    // part de 'annulee'.
    if (status === 'annulee') {
      for (const item of order.items ?? []) {
        tx.update(db.collection('products').doc(item.productId), {
          stock: FieldValue.increment(item.quantity),
        });
      }
    }
    tx.update(ref, { status, updatedAt: new Date().toISOString() });
    return { ok: true };
  });
}
