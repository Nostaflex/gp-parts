import { describe, it, expect, vi } from 'vitest';

import { handleStripeEvent } from '@/lib/stripe-webhook';
import type { Order } from '@/lib/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-001',
    orderNumber: 'GP-2026-001',
    status: 'nouvelle',
    customer: { firstName: 'Jean', lastName: 'Dupont', email: 'j@x.fr', phone: '0690000000' },
    delivery: { option: 'store-pickup', address: '', city: '', postalCode: '', priceInCents: 0 },
    items: [
      {
        productId: 'p1',
        slug: 's',
        name: 'n',
        reference: 'r',
        priceInCents: 5980,
        quantity: 1,
        image: '',
      },
    ],
    subtotalInCents: 5980,
    totalInCents: 5980,
    acceptsMarketing: false,
    paymentMethod: 'card',
    paymentStatus: 'pending',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// Faux event Stripe minimal.
function event(type: string, piId = 'pi_test_1', orderId = 'order-001') {
  return {
    type,
    data: { object: { id: piId, metadata: { orderId } } },
  } as never;
}

function makeDeps(initialOrder: Order | null) {
  let stored = initialOrder;
  return {
    getOrderById: vi.fn(async () => stored),
    updateOrderPayment: vi.fn(async (_id: string, patch: Partial<Order>) => {
      if (stored) stored = { ...stored, ...patch };
    }),
    sendOrderEmails: vi.fn(),
  };
}

describe('handleStripeEvent — payment_intent.succeeded', () => {
  it('passe la commande à paid + stocke le PaymentIntent id + envoie les emails', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('payment_intent.succeeded', 'pi_abc'), deps);
    expect(deps.updateOrderPayment).toHaveBeenCalledWith('order-001', {
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_abc',
    });
    expect(deps.sendOrderEmails).toHaveBeenCalledTimes(1);
  });

  it('idempotent : un 2e event succeeded sur une commande déjà payée ne renvoie pas les emails', async () => {
    const deps = makeDeps(makeOrder({ paymentStatus: 'paid' }));
    await handleStripeEvent(event('payment_intent.succeeded'), deps);
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
    expect(deps.updateOrderPayment).not.toHaveBeenCalled();
  });

  it('commande introuvable : no-op (pas de crash, pas d’email)', async () => {
    const deps = makeDeps(null);
    await handleStripeEvent(event('payment_intent.succeeded'), deps);
    expect(deps.updateOrderPayment).not.toHaveBeenCalled();
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });
});

describe('handleStripeEvent — payment_intent.payment_failed', () => {
  it('passe la commande à failed, sans email', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('payment_intent.payment_failed'), deps);
    expect(deps.updateOrderPayment).toHaveBeenCalledWith('order-001', {
      paymentStatus: 'failed',
    });
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });
});

describe('handleStripeEvent — event ignoré', () => {
  it('type inconnu : no-op', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('charge.refunded'), deps);
    expect(deps.updateOrderPayment).not.toHaveBeenCalled();
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });
});
