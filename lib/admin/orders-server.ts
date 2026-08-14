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

export async function updateOrderPaymentAdmin(
  id: string,
  patch: { paymentStatus: PaymentStatus; stripePaymentIntentId?: string }
): Promise<void> {
  const update: Record<string, unknown> = {
    paymentStatus: patch.paymentStatus,
    updatedAt: new Date().toISOString(),
  };
  if (patch.stripePaymentIntentId) update.stripePaymentIntentId = patch.stripePaymentIntentId;
  await getAdminFirestore().collection('orders').doc(id).update(update);
}

export async function updateOrderStatusAdmin(id: string, status: OrderStatus): Promise<void> {
  await getAdminFirestore()
    .collection('orders')
    .doc(id)
    .update({ status, updatedAt: new Date().toISOString() });
}
