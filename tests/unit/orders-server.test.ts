import { describe, it, expect, vi, beforeEach } from 'vitest';

// Fixture d'ordre valide (parseOrder) — createdAt/updatedAt = Timestamps
// Admin SDK (duck-typed .toDate()) pour vérifier la conversion → ISO string.
const ts = { toDate: () => new Date('2026-07-01T00:00:00.000Z') };
const orderData: Record<string, unknown> = {
  orderNumber: 'GP-1',
  status: 'nouvelle',
  customer: { firstName: 'A', lastName: 'B', email: 'a@b.co', phone: '0690000000' },
  delivery: { option: 'store-pickup', address: '', city: '', postalCode: '', priceInCents: 0 },
  items: [
    {
      productId: 'p',
      slug: 's',
      name: 'n',
      reference: 'r',
      priceInCents: 100,
      quantity: 1,
      image: '',
    },
  ],
  subtotalInCents: 100,
  totalInCents: 100,
  acceptsMarketing: false,
  paymentStatus: 'pending',
  createdAt: ts,
  updatedAt: ts,
};

const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];

function fakeQuery(docs: Array<{ id: string; data: () => unknown }>) {
  const q = {
    where: () => q,
    limit: () => q,
    orderBy: () => q,
    get: async () => ({ docs }),
  };
  return q;
}
const fakeDb = {
  collection: () => ({
    orderBy: () => fakeQuery([{ id: 'o1', data: () => orderData }]),
    doc: (id: string) => ({
      get: async () => ({ exists: id !== 'missing', data: () => orderData }),
      update: async (patch: Record<string, unknown>) => void updates.push({ id, patch }),
    }),
  }),
};
vi.mock('@/lib/firebase-admin', () => ({ getAdminFirestore: () => fakeDb }));

beforeEach(() => {
  updates.length = 0;
});

describe('orders-server (Admin SDK — contourne les rules isAdmin)', () => {
  it('getOrderByIdAdmin : renvoie l’ordre + convertit les Timestamps en ISO', async () => {
    const { getOrderByIdAdmin } = await import('@/lib/admin/orders-server');
    const o = await getOrderByIdAdmin('o1');
    expect(o?.id).toBe('o1');
    expect(o?.createdAt).toBe('2026-07-01T00:00:00.000Z');
  });

  it('getOrderByIdAdmin : doc absent → null', async () => {
    const { getOrderByIdAdmin } = await import('@/lib/admin/orders-server');
    expect(await getOrderByIdAdmin('missing')).toBeNull();
  });

  it('updateOrderStatusAdmin : écrit le nouveau statut', async () => {
    const { updateOrderStatusAdmin } = await import('@/lib/admin/orders-server');
    await updateOrderStatusAdmin('o1', 'confirmee');
    expect(updates[0].patch.status).toBe('confirmee');
  });

  it('getOrdersAdmin : renvoie la liste parsée', async () => {
    const { getOrdersAdmin } = await import('@/lib/admin/orders-server');
    const list = await getOrdersAdmin({ limit: 10 });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('o1');
  });
});
