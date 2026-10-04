import { describe, it, expect, vi } from 'vitest';

const getDocsMock = vi.fn();
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ name })),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: class {},
}));
vi.mock('@/lib/firebase', () => ({ db: {} }));

import { FirebaseAdapter } from '@/lib/data/firebase';

const snapshot = (docs: Array<Record<string, unknown> & { id: string }>) => ({
  docs: docs.map((d) => ({ id: d.id, data: () => d })),
});

// Bouton « Supprimer » du BO = soft-delete `deletedAt`. L'adapter est le point
// de passage unique de tous les lecteurs (site public, BO, posts, Leboncoin).
const annonces = [
  { id: 'historique' }, // créée avant le champ : pas de deletedAt
  { id: 'active', deletedAt: null },
  { id: 'supprimee', deletedAt: '2026-10-04T00:00:00.000Z' },
  { id: 'vendue', disponibilite: 'vendu' }, // vendu ≠ supprimé : reste affichée
];

describe('FirebaseAdapter — annonces supprimées', () => {
  it('getVehicules ignore les annonces supprimées et garde les autres', async () => {
    getDocsMock.mockResolvedValueOnce(snapshot(annonces));
    const ids = (await new FirebaseAdapter().getVehicules()).map((v) => v.id);
    expect(ids).toEqual(['historique', 'active', 'vendue']);
  });

  it('getMotos ignore les annonces supprimées et garde les autres', async () => {
    getDocsMock.mockResolvedValueOnce(snapshot(annonces));
    const ids = (await new FirebaseAdapter().getMotos()).map((m) => m.id);
    expect(ids).toEqual(['historique', 'active', 'vendue']);
  });
});
