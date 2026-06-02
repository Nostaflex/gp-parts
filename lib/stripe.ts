import Stripe from 'stripe';

// Singleton — instancié une seule fois côté serveur (même pattern que getResend).
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY manquante');
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

/**
 * Crée un PaymentIntent pour une commande.
 *
 * Le montant est TOUJOURS celui recalculé serveur (`order.totalInCents`),
 * jamais un prix venu du client. `orderId` / `orderNumber` sont placés en
 * metadata : le webhook les relit pour muter la bonne commande.
 *
 * Le client Stripe est injectable (défaut : `getStripe()`) pour les tests.
 */
export async function createOrderPaymentIntent(
  order: { id: string; orderNumber: string; totalInCents: number },
  stripe: Pick<Stripe, 'paymentIntents'> = getStripe()
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const intent = await stripe.paymentIntents.create({
    amount: order.totalInCents,
    currency: 'eur',
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    automatic_payment_methods: { enabled: true },
  });

  if (!intent.client_secret) {
    throw new Error('PaymentIntent sans client_secret');
  }

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}
