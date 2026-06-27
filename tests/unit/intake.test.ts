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
    const id = await createDemandeIntake({ type: 'contact' } as never);
    expect(addMock).toHaveBeenCalledWith({ type: 'contact' });
    expect(id).toBe('new-id');
  });

  it('createReservationIntake add + renvoie id', async () => {
    const id = await createReservationIntake({ locationCarId: 'x' } as never);
    expect(addMock).toHaveBeenCalled();
    expect(id).toBe('new-id');
  });
});
