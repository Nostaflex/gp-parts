import { describe, it, expect, vi, beforeEach } from 'vitest';

// Admin SDK mocké : collection(name).where(...).count().get() → { data: () => ({ count }) }
const { collectionMock, countsByCollection } = vi.hoisted(() => {
  const countsByCollection: Record<string, number | Error> = {};
  const collectionMock = vi.fn((name: string) => ({
    where: vi.fn(() => ({
      count: vi.fn(() => ({
        get: vi.fn(async () => {
          const v = countsByCollection[name];
          if (v instanceof Error) throw v;
          return { data: () => ({ count: v ?? 0 }) };
        }),
      })),
    })),
  }));
  return { collectionMock, countsByCollection };
});

vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ collection: collectionMock })),
}));

import { getNavBadges } from '@/lib/admin/nav-badges';

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(countsByCollection)) delete countsByCollection[k];
});

describe('getNavBadges', () => {
  it('compte les status=nouvelle des 3 collections', async () => {
    countsByCollection.orders = 3;
    countsByCollection.reservations = 1;
    countsByCollection.demandes = 7;
    const badges = await getNavBadges();
    expect(badges).toEqual({ commandes: 3, reservations: 1, demandes: 7 });
    expect(collectionMock).toHaveBeenCalledWith('orders');
    expect(collectionMock).toHaveBeenCalledWith('reservations');
    expect(collectionMock).toHaveBeenCalledWith('demandes');
  });

  it('fail-open : erreur Firestore → zéros + console.warn (jamais muet)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    countsByCollection.orders = new Error('boom');
    countsByCollection.reservations = 1;
    countsByCollection.demandes = 2;
    const badges = await getNavBadges();
    expect(badges).toEqual({ commandes: 0, reservations: 0, demandes: 0 });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
