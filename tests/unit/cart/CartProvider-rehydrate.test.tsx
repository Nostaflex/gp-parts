import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { act } from 'react';

// ── Mock server action: control what active products look like ─────────────
const mockGetActive = vi.fn();
vi.mock('@/lib/cart/active-products', () => ({
  getActiveProductsForCart: () => mockGetActive(),
}));

// Import AFTER mock
import { CartProvider, useCart } from '@/components/cart/CartProvider';

const STORAGE_KEY = 'gpparts-cart';

function CartProbe({ onItems }: { onItems: (items: unknown[], isReady: boolean) => void }) {
  const { items, isReady } = useCart();
  onItems(items, isReady);
  return null;
}

describe('CartProvider — rehydrate contre catalogue actif (Phase 5 §9.20)', () => {
  beforeEach(() => {
    mockGetActive.mockReset();
    localStorage.clear();
  });

  it('drop un item dont le productId est absent du catalogue actif', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'prod-ghost',
          productId: 'prod-ghost',
          slug: 'ghost',
          name: 'Ghost',
          reference: 'G-1',
          price: 1000,
          quantity: 2,
          image: '',
          stock: 5,
        },
      ])
    );
    mockGetActive.mockResolvedValue([]); // catalogue actif vide → item drop

    const captured: { items: unknown[]; isReady: boolean } = { items: [], isReady: false };
    await act(async () => {
      render(
        <CartProvider>
          <CartProbe
            onItems={(items, isReady) => {
              captured.items = items;
              captured.isReady = isReady;
            }}
          />
        </CartProvider>
      );
    });

    await waitFor(() => expect(captured.isReady).toBe(true));
    expect(captured.items).toEqual([]);
  });

  it('drop un item dont le stock catalogue actif est 0', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'prod-1',
          productId: 'prod-1',
          slug: 'p1',
          name: 'P1',
          reference: 'P-1',
          price: 1000,
          quantity: 1,
          image: '',
          stock: 5,
        },
      ])
    );
    mockGetActive.mockResolvedValue([
      {
        id: 'prod-1',
        slug: 'p1-new',
        name: 'P1 New',
        reference: 'P-1',
        price: 1200,
        image: '/new.jpg',
        stock: 0, // rupture
      },
    ]);

    const captured: { items: unknown[]; isReady: boolean } = { items: [], isReady: false };
    await act(async () => {
      render(
        <CartProvider>
          <CartProbe
            onItems={(items, isReady) => {
              captured.items = items;
              captured.isReady = isReady;
            }}
          />
        </CartProvider>
      );
    });

    await waitFor(() => expect(captured.isReady).toBe(true));
    expect(captured.items).toEqual([]);
  });

  it('met à jour prix/nom/image depuis la source live (pas localStorage)', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'prod-1',
          productId: 'prod-1',
          slug: 'old-slug',
          name: 'Old Name',
          reference: 'OLD-REF',
          price: 1000, // stale
          quantity: 3,
          image: '/old.jpg',
          stock: 5,
        },
      ])
    );
    mockGetActive.mockResolvedValue([
      {
        id: 'prod-1',
        slug: 'new-slug',
        name: 'New Name',
        reference: 'NEW-REF',
        price: 1500,
        image: '/new.jpg',
        stock: 4,
      },
    ]);

    const captured: { items: any[]; isReady: boolean } = { items: [], isReady: false };
    await act(async () => {
      render(
        <CartProvider>
          <CartProbe
            onItems={(items, isReady) => {
              captured.items = items as any[];
              captured.isReady = isReady;
            }}
          />
        </CartProvider>
      );
    });

    await waitFor(() => expect(captured.isReady).toBe(true));
    expect(captured.items).toHaveLength(1);
    expect(captured.items[0].name).toBe('New Name');
    expect(captured.items[0].price).toBe(1500);
    expect(captured.items[0].slug).toBe('new-slug');
    expect(captured.items[0].image).toBe('/new.jpg');
    // Quantité clampée sur stock
    expect(captured.items[0].quantity).toBe(3);
  });

  it("ne casse pas le panier si l'action serveur échoue (fallback persisted)", async () => {
    const persisted = [
      {
        id: 'prod-1',
        productId: 'prod-1',
        slug: 'p1',
        name: 'P1',
        reference: 'P-1',
        price: 1000,
        quantity: 2,
        image: '',
        stock: 5,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    mockGetActive.mockRejectedValue(new Error('network'));

    const captured: { items: any[]; isReady: boolean } = { items: [], isReady: false };
    await act(async () => {
      render(
        <CartProvider>
          <CartProbe
            onItems={(items, isReady) => {
              captured.items = items as any[];
              captured.isReady = isReady;
            }}
          />
        </CartProvider>
      );
    });

    await waitFor(() => expect(captured.isReady).toBe(true));
    expect(captured.items).toHaveLength(1);
    expect(captured.items[0].productId).toBe('prod-1');
  });
});
