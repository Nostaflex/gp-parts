import type Stripe from 'stripe';
import type { Order, PaymentStatus } from '@/lib/types';

/**
 * Dépendances injectées du handler webhook (testabilité : pas d'I/O réel en
 * test). En prod : Admin SDK (orders-server, stripe-events) + envoi Resend.
 */
export interface StripeWebhookDeps {
  /** Revendique l'event (ledger, doc id = event.id). false = déjà traité. */
  claimEvent(eventId: string, type: string): Promise<boolean>;
  getOrderById(id: string): Promise<Order | null>;
  /** Règlement TRANSACTIONNEL : un seul appelant obtient 'applied'. */
  settlePayment(
    id: string,
    patch: { paymentStatus: PaymentStatus; stripePaymentIntentId?: string }
  ): Promise<'applied' | 'already' | 'not_found'>;
  sendOrderEmails(order: Order): void;
}

/**
 * Traite un event Stripe. Le webhook est la **source de vérité** du paiement.
 *
 * Durci suite à l'audit 2026-08-18 :
 * 1. **Ledger d'events** : Stripe peut livrer le même event deux fois, y
 *    compris en concurrence — seul le premier `claimEvent` traite.
 * 2. **Validation montant/devise** : un PaymentIntent qui ne correspond pas
 *    au total serveur de la commande ne la marque JAMAIS payée.
 * 3. **Règlement transactionnel** : le « déjà paid ? » est atomique avec
 *    l'écriture — plus de double email en cas de course.
 */
export async function handleStripeEvent(
  event: Stripe.Event,
  deps: StripeWebhookDeps
): Promise<void> {
  if (event.type !== 'payment_intent.succeeded' && event.type !== 'payment_intent.payment_failed') {
    return; // event non géré : no-op
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;

  // Idempotence forte inter-instances : premier arrivé, seul servi.
  const claimed = await deps.claimEvent(event.id, event.type);
  if (!claimed) return;

  const order = await deps.getOrderById(orderId);
  if (!order) return; // commande introuvable : no-op

  if (event.type === 'payment_intent.succeeded') {
    // Le montant payé doit être EXACTEMENT le total recalculé serveur, en
    // euros. Mismatch = on ne marque rien payé ; la commande reste 'pending'
    // pour inspection humaine (200 renvoyé : rejouer ne changerait rien).
    if (intent.amount !== order.totalInCents || intent.currency !== 'eur') {
      console.error(
        `[stripe-webhook] MISMATCH montant/devise sur ${orderId} : ` +
          `intent ${intent.amount} ${intent.currency} ≠ commande ${order.totalInCents} eur — ` +
          `commande laissée '${order.paymentStatus}', intervention manuelle requise.`
      );
      return;
    }

    const settled = await deps.settlePayment(orderId, {
      paymentStatus: 'paid',
      stripePaymentIntentId: intent.id,
    });
    if (settled !== 'applied') return; // déjà réglé par un autre chemin : pas de 2e email
    deps.sendOrderEmails({
      ...order,
      paymentStatus: 'paid',
      stripePaymentIntentId: intent.id,
    });
    return;
  }

  // payment_intent.payment_failed — ne jamais écraser un paiement réussi.
  if (order.paymentStatus === 'paid') return;
  await deps.settlePayment(orderId, { paymentStatus: 'failed' });
}
