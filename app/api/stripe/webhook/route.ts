import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getStripe } from '@/lib/stripe';
import { handleStripeEvent } from '@/lib/stripe-webhook';
import { sendOrderEmails } from '@/lib/emails/send';
import { getAdapter } from '@/lib/data';

// Le webhook reçoit le corps brut (signature calculée dessus). Pas de cache,
// pas de pré-parsing du body par Next.
export const dynamic = 'force-dynamic';

/**
 * Webhook Stripe — source de vérité du paiement (chemin carte).
 *
 * Vérifie la signature (`STRIPE_WEBHOOK_SECRET`) sur le corps BRUT, puis
 * délègue à `handleStripeEvent` (idempotent). Retourne 400 si la signature
 * est invalide — Stripe rejouera.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET manquante');
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error('[stripe/webhook] Signature invalide:', err);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    const adapter = await getAdapter();
    await handleStripeEvent(event, {
      getOrderById: (id) => adapter.getOrderById(id),
      updateOrderPayment: (id, patch) => adapter.updateOrderPayment(id, patch),
      sendOrderEmails,
    });
  } catch (err) {
    console.error('[stripe/webhook] Traitement event échoué:', err);
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
