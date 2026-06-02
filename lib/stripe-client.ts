import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Promesse singleton — Stripe.js n'est chargé qu'une fois côté navigateur.
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('[stripe-client] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquante');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
