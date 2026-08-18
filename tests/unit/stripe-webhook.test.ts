import { describe, it, expect, vi } from 'vitest';

import { handleStripeEvent } from '@/lib/stripe-webhook';
import type { Order, PaymentStatus } from '@/lib/types';

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

// Faux event Stripe minimal — montant/devise alignés sur makeOrder par défaut
// (le webhook durci les valide, audit 2026-08-18).
function event(
  type: string,
  opts: {
    piId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    eventId?: string;
  } = {}
) {
  return {
    id: opts.eventId ?? 'evt_test_1',
    type,
    data: {
      object: {
        id: opts.piId ?? 'pi_test_1',
        amount: opts.amount ?? 5980,
        currency: opts.currency ?? 'eur',
        metadata: { orderId: opts.orderId ?? 'order-001' },
      },
    },
  } as never;
}

function makeDeps(initialOrder: Order | null, opts: { claimed?: boolean } = {}) {
  let stored = initialOrder;
  return {
    claimEvent: vi.fn(async () => opts.claimed ?? true),
    getOrderById: vi.fn(async () => stored),
    settlePayment: vi.fn(
      async (
        _id: string,
        patch: { paymentStatus: PaymentStatus }
      ): Promise<'applied' | 'already' | 'not_found'> => {
        if (!stored) return 'not_found';
        if (stored.paymentStatus === patch.paymentStatus) return 'already';
        stored = { ...stored, ...patch };
        return 'applied';
      }
    ),
    sendOrderEmails: vi.fn(),
  };
}

describe('handleStripeEvent — payment_intent.succeeded', () => {
  it('passe la commande à paid + stocke le PaymentIntent id + envoie les emails', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('payment_intent.succeeded', { piId: 'pi_abc' }), deps);
    expect(deps.settlePayment).toHaveBeenCalledWith('order-001', {
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_abc',
    });
    expect(deps.sendOrderEmails).toHaveBeenCalledTimes(1);
  });

  it('idempotent (CAS) : commande déjà payée → settle « already », zéro email', async () => {
    const deps = makeDeps(makeOrder({ paymentStatus: 'paid' }));
    await handleStripeEvent(event('payment_intent.succeeded'), deps);
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });

  it('ledger : event déjà revendiqué par une autre instance → AUCUN traitement', async () => {
    const deps = makeDeps(makeOrder(), { claimed: false });
    await handleStripeEvent(event('payment_intent.succeeded'), deps);
    expect(deps.getOrderById).not.toHaveBeenCalled();
    expect(deps.settlePayment).not.toHaveBeenCalled();
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });

  it('MISMATCH montant : la commande n’est JAMAIS marquée payée', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('payment_intent.succeeded', { amount: 100 }), deps);
    expect(deps.settlePayment).not.toHaveBeenCalled();
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });

  it('MISMATCH devise : idem', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('payment_intent.succeeded', { currency: 'usd' }), deps);
    expect(deps.settlePayment).not.toHaveBeenCalled();
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });

  it('commande introuvable : no-op (pas de crash, pas d’email)', async () => {
    const deps = makeDeps(null);
    await handleStripeEvent(event('payment_intent.succeeded'), deps);
    expect(deps.settlePayment).not.toHaveBeenCalled();
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });
});

describe('handleStripeEvent — payment_intent.payment_failed', () => {
  it('passe la commande à failed, sans email', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('payment_intent.payment_failed'), deps);
    expect(deps.settlePayment).toHaveBeenCalledWith('order-001', { paymentStatus: 'failed' });
    expect(deps.sendOrderEmails).not.toHaveBeenCalled();
  });

  it('n’écrase JAMAIS un paiement déjà réussi', async () => {
    const deps = makeDeps(makeOrder({ paymentStatus: 'paid' }));
    await handleStripeEvent(event('payment_intent.payment_failed'), deps);
    expect(deps.settlePayment).not.toHaveBeenCalled();
  });
});

describe('handleStripeEvent — event ignoré', () => {
  it('type inconnu : no-op, même pas de claim (le ledger ne gonfle pas)', async () => {
    const deps = makeDeps(makeOrder());
    await handleStripeEvent(event('charge.refunded'), deps);
    expect(deps.claimEvent).not.toHaveBeenCalled();
    expect(deps.settlePayment).not.toHaveBeenCalled();
  });
});
