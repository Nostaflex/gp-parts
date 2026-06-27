import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createReservationIntake } = vi.hoisted(() => ({
  createReservationIntake: vi.fn(async () => 'res-1'),
}));
vi.mock('@/lib/server/intake', () => ({ createReservationIntake }));
vi.mock('@/lib/data', () => ({ getAdapter: vi.fn(async () => ({ getLocationCarById: vi.fn() })) }));
vi.mock('@/lib/emails/send', () => ({ sendReservationEmails: vi.fn() }));

import { validateReservation } from '@/app/location/actions';

const base = {
  locationCarId: 'car-1',
  dateDepart: '2026-07-10',
  dateRetour: '2026-07-12',
  prenom: 'Paul',
  nom: 'Test',
  email: 'paul@test.gp',
  telephone: '0690112233',
  permis: 'B',
  consent: true,
};

describe('validateReservation honeypot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('honeypot rempli → succès factice, aucune création', async () => {
    const res = await validateReservation({ ...base, website: 'spam' } as never);
    expect(createReservationIntake).not.toHaveBeenCalled();
    expect(res.success).toBe(true);
  });
});
