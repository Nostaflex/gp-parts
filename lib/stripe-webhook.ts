import type Stripe from 'stripe';
import type { Order, PaymentStatus } from '@/lib/types';

/**
 * Dépendances injectées du handler webhook (testabilité : pas d'I/O réel en
 * test). En prod : `getAdapter()` + envoi Resend.
 */
export interface StripeWebhookDeps {
  getOrderById(id: string): Promise<Order | null>;
  updateOrderPayment(
    id: string,
    patch: { paymentStatus: PaymentStatus; stripePaymentIntentId?: string }
  ): Promise<void>;
  sendOrderEmails(order: Order): void;
}

/**
 * Traite un event Stripe. Le webhook est la **source de vérité** du paiement.
 *
 * - `payment_intent.succeeded` → commande `paid` + stockage du PaymentIntent id
 *   + envoi des emails (confirmation client + notif gérant).
 * - `payment_intent.payment_failed` → commande `failed`.
 *
 * **Idempotent** : Stripe peut rejouer un event. On vérifie `paymentStatus`
 * avant de muter / d'envoyer les mails — jamais 2× les emails.
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

  const order = await deps.getOrderById(orderId);
  if (!order) return; // commande introuvable : no-op

  if (event.type === 'payment_intent.succeeded') {
    if (order.paymentStatus === 'paid') return; // déjà traité : idempotent
    await deps.updateOrderPayment(orderId, {
      paymentStatus: 'paid',
      stripePaymentIntentId: intent.id,
    });
    deps.sendOrderEmails({
      ...order,
      paymentStatus: 'paid',
      stripePaymentIntentId: intent.id,
    });
    return;
  }

  // payment_intent.payment_failed
  if (order.paymentStatus === 'failed') return; // idempotent
  await deps.updateOrderPayment(orderId, { paymentStatus: 'failed' });
}
