import { describe, it, expect } from 'vitest';

import { buildOrderNotificationEmail } from '@/lib/emails/orderNotification';

import type { Order } from '@/lib/types';

const baseOrder: Order = {
  id: 'order-001',
  orderNumber: 'GP-2026-042',
  status: 'nouvelle',
  customer: {
    firstName: 'Marie',
    lastName: 'Toussaint',
    email: 'marie.toussaint@example.com',
    phone: '0690998877',
  },
  delivery: {
    option: 'island-delivery',
    address: '12 rue des Flamboyants',
    city: 'Le Gosier',
    postalCode: '97190',
    priceInCents: 500,
  },
  items: [
    {
      productId: 'prod-001',
      slug: 'amortisseur-avant',
      name: 'Amortisseur avant',
      reference: 'REF-AMO-01',
      priceInCents: 8900,
      quantity: 2,
      image: '/img/a.jpg',
    },
  ],
  subtotalInCents: 17800,
  totalInCents: 18300,
  acceptsMarketing: false,
  createdAt: '2026-05-15T10:00:00Z',
  updatedAt: '2026-05-15T10:00:00Z',
};

describe('buildOrderNotificationEmail', () => {
  it('subject contient le numéro de commande et le nom client', () => {
    const { subject } = buildOrderNotificationEmail(baseOrder);
    expect(subject).toContain('GP-2026-042');
    expect(subject).toContain('Marie');
    expect(subject).toContain('Toussaint');
  });

  it('subject signale une nouvelle commande', () => {
    const { subject } = buildOrderNotificationEmail(baseOrder);
    expect(subject).toContain('Nouvelle commande');
  });

  it('html expose les coordonnées client (tel + email)', () => {
    const { html } = buildOrderNotificationEmail(baseOrder);
    expect(html).toContain('0690998877');
    expect(html).toContain('marie.toussaint@example.com');
    expect(html).toContain('tel:0690998877');
    expect(html).toContain('mailto:marie.toussaint@example.com');
  });

  it('html contient les articles et le total', () => {
    const { html } = buildOrderNotificationEmail(baseOrder);
    expect(html).toContain('Amortisseur avant');
    expect(html).toContain('REF-AMO-01');
    expect(html).toContain('183,00'); // total 18300 centimes
  });

  it('html affiche l’adresse de livraison à domicile', () => {
    const { html } = buildOrderNotificationEmail(baseOrder);
    expect(html).toContain('12 rue des Flamboyants');
    expect(html).toContain('Le Gosier');
    expect(html).toContain('97190');
  });

  it('mode retrait boutique affiché sans adresse', () => {
    const pickup: Order = {
      ...baseOrder,
      delivery: { option: 'store-pickup', address: '', city: '', postalCode: '', priceInCents: 0 },
    };
    const { html } = buildOrderNotificationEmail(pickup);
    expect(html).toContain('Retrait en boutique');
  });

  it('échappe le HTML dans les champs client (anti-injection)', () => {
    const evil: Order = {
      ...baseOrder,
      customer: { ...baseOrder.customer, lastName: '<script>x</script>' },
    };
    const { html } = buildOrderNotificationEmail(evil);
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
