import { describe, it, expect, vi, beforeEach } from 'vitest';

const addMock = vi.fn(async () => ({ id: 'new-id' }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ collection: () => ({ add: addMock }) })),
}));

import { createDemandeIntake, createReservationIntake } from '@/lib/server/intake';

describe('intake (Admin SDK)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createDemandeIntake add + renvoie id', async () => {
    const id = await createDemandeIntake({
      type: 'contact',
      expiresAt: Date.now() + 1000,
    } as never);
    // Nouveau contrat TTL : expiresAt écrit en Timestamp natif Firestore.
    const written = (addMock.mock.calls as unknown[][])[0][0] as {
      type: string;
      expiresAt: { toMillis: () => number };
    };
    expect(written.type).toBe('contact');
    expect(typeof written.expiresAt.toMillis).toBe('function');
    expect(id).toBe('new-id');
  });

  it('createReservationIntake add + renvoie id', async () => {
    const id = await createReservationIntake({
      locationCarId: 'x',
      expiresAt: Date.now() + 1000,
    } as never);
    expect(addMock).toHaveBeenCalled();
    expect(id).toBe('new-id');
  });
});
