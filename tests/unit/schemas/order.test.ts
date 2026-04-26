import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { orderSchema, parseOrder } from '@/lib/schemas/order';

const validOrder = {
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

describe('orderSchema', () => {
  it('parses a valid order with store-pickup delivery', () => {
    const result = orderSchema.parse(validOrder);
    expect(result.id).toBe('order-001');
    expect(result.delivery.option).toBe('store-pickup');
    expect(result.items).toHaveLength(1);
  });

  it('parses a valid order with island-delivery', () => {
    const islandOrder = {
      ...validOrder,
      delivery: {
        option: 'island-delivery',
        address: '12 rue des Flamboyants',
        city: 'Pointe-à-Pitre',
        postalCode: '97110',
        priceInCents: 500,
      },
    };
    const result = orderSchema.parse(islandOrder);
    expect(result.delivery.option).toBe('island-delivery');
    expect(result.delivery.city).toBe('Pointe-à-Pitre');
  });

  it('throws ZodError when items array is missing', () => {
    const { items, ...incomplete } = validOrder;
    expect(() => orderSchema.parse(incomplete)).toThrow(ZodError);
  });

  it('throws ZodError on invalid email format', () => {
    expect(() =>
      orderSchema.parse({
        ...validOrder,
        customer: { ...validOrder.customer, email: 'not-an-email' },
      })
    ).toThrow(ZodError);
  });

  it('throws ZodError on invalid status value', () => {
    expect(() => orderSchema.parse({ ...validOrder, status: 'inconnu' })).toThrow(ZodError);
  });

  it('accepts all valid status values', () => {
    const statuses = ['nouvelle', 'confirmee', 'preparation', 'expediee', 'livree', 'annulee'];
    for (const status of statuses) {
      expect(() => orderSchema.parse({ ...validOrder, status })).not.toThrow();
    }
  });

  it('throws ZodError when items array is empty', () => {
    expect(() => orderSchema.parse({ ...validOrder, items: [] })).toThrow(ZodError);
  });

  it('throws ZodError on negative priceInCents in item', () => {
    expect(() =>
      orderSchema.parse({
        ...validOrder,
        items: [{ ...validOrder.items[0], priceInCents: -1 }],
      })
    ).toThrow(ZodError);
  });

  it('throws ZodError on invalid delivery option', () => {
    expect(() =>
      orderSchema.parse({
        ...validOrder,
        delivery: { ...validOrder.delivery, option: 'carrier-pigeon' },
      })
    ).toThrow(ZodError);
  });
});

describe('parseOrder', () => {
  it('returns a typed Order object', () => {
    const result = parseOrder(validOrder);
    expect(result.orderNumber).toBe('GP-2026-001');
    expect(result.customer.firstName).toBe('Jean');
    expect(result.totalInCents).toBe(5980);
  });

  it('throws ZodError on invalid data', () => {
    expect(() => parseOrder({ invalid: true })).toThrow(ZodError);
  });
});
