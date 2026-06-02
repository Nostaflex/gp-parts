import { describe, it, expect, vi } from 'vitest';

import { createOrderPaymentIntent } from '@/lib/stripe';

// Faux client Stripe injecté : pas d'appel réseau réel en test.
function fakeStripe() {
  return {
    paymentIntents: {
      create: vi.fn(async (params: Record<string, unknown>) => ({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
        ...params,
      })),
    },
  };
}

describe('createOrderPaymentIntent', () => {
  it('crée un PaymentIntent dont le montant == total commande recalculé serveur', async () => {
    const stripe = fakeStripe();
    await createOrderPaymentIntent(
      { id: 'order-001', orderNumber: 'GP-2026-001', totalInCents: 5980 },
      stripe as never
    );
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5980,
        currency: 'eur',
        metadata: { orderId: 'order-001', orderNumber: 'GP-2026-001' },
      })
    );
  });

  it('renvoie clientSecret et paymentIntentId', async () => {
    const stripe = fakeStripe();
    const result = await createOrderPaymentIntent(
      { id: 'order-002', orderNumber: 'GP-2026-002', totalInCents: 1000 },
      stripe as never
    );
    expect(result.clientSecret).toBe('pi_test_123_secret_abc');
    expect(result.paymentIntentId).toBe('pi_test_123');
  });
});
