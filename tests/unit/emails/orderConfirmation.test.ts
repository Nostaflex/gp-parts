import { describe, it, expect } from 'vitest';
import { buildOrderConfirmationEmail } from '@/lib/emails/orderConfirmation';
import type { Order } from '@/lib/types';

const validOrder: Order = {
  id: 'order-001',
  orderNumber: 'GP-2026-001',
  status: 'nouvelle',
  customer: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '0690123456',
  },
  delivery: {
    option: 'store-pickup',
    address: '',
    city: '',
    postalCode: '',
    priceInCents: 0,
  },
  items: [
    {
      productId: 'prod-001',
      slug: 'plaquettes-frein',
      name: 'Plaquettes de frein',
      reference: 'REF-001',
      priceInCents: 2990,
      quantity: 2,
      image: '/images/p.jpg',
    },
  ],
  subtotalInCents: 5980,
  totalInCents: 5980,
  acceptsMarketing: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('buildOrderConfirmationEmail', () => {
  it('returns a subject containing the order number', () => {
    const { subject } = buildOrderConfirmationEmail(validOrder);
    expect(subject).toContain('GP-2026-001');
  });

  it('subject contains "Commande confirmée"', () => {
    const { subject } = buildOrderConfirmationEmail(validOrder);
    expect(subject).toContain('Commande confirmée');
  });

  it('html contains customer firstName uppercased', () => {
    const { html } = buildOrderConfirmationEmail(validOrder);
    expect(html).toContain('JEAN');
  });

  it('html contains item name', () => {
    const { html } = buildOrderConfirmationEmail(validOrder);
    expect(html).toContain('Plaquettes de frein');
  });

  it('html contains formatted total price', () => {
    const { html } = buildOrderConfirmationEmail(validOrder);
    // 5980 centimes → "59,80 €"
    expect(html).toContain('59,80');
  });

  it('html contains store-pickup delivery label when option is store-pickup', () => {
    const { html } = buildOrderConfirmationEmail(validOrder);
    expect(html).toContain('Retrait en boutique');
  });

  it('html contains delivery address when option is island-delivery', () => {
    const islandOrder: Order = {
      ...validOrder,
      delivery: {
        option: 'island-delivery',
        address: '12 rue des Flamboyants',
        city: 'Pointe-à-Pitre',
        postalCode: '97110',
        priceInCents: 500,
      },
    };
    const { html } = buildOrderConfirmationEmail(islandOrder);
    expect(html).toContain('12 rue des Flamboyants');
    expect(html).toContain('Pointe-à-Pitre');
  });

  it('html escapes XSS in order number', () => {
    const xssOrder: Order = {
      ...validOrder,
      orderNumber: '<script>alert(1)</script>',
    };
    const { subject, html } = buildOrderConfirmationEmail(xssOrder);
    expect(subject).not.toContain('<script>');
    expect(subject).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('free delivery shows "Gratuit"', () => {
    const { html } = buildOrderConfirmationEmail(validOrder);
    expect(html).toContain('Gratuit');
  });

  it('paid delivery shows formatted price', () => {
    const paidOrder: Order = {
      ...validOrder,
      delivery: {
        option: 'island-delivery',
        address: '12 rue des Flamboyants',
        city: 'Pointe-à-Pitre',
        postalCode: '97110',
        priceInCents: 500,
      },
      totalInCents: 6480,
    };
    const { html } = buildOrderConfirmationEmail(paidOrder);
    // 500 centimes → "5,00 €"
    expect(html).toContain('5,00');
  });
});
