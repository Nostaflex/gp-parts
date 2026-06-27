import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/emails/send', () => ({ sendReservationEmails: vi.fn() }));
vi.mock('@/lib/server/intake', () => ({ createReservationIntake: vi.fn(async () => 'res-test') }));

import { validateReservation } from '../../app/location/actions';

const base = {
  locationCarId: 'clio-v',
  dateDepart: '2099-07-01',
  dateRetour: '2099-07-05',
  prenom: 'Marie',
  nom: 'Dupont',
  email: 'marie@example.com',
  telephone: '0690123456',
  permis: '123456789',
  consent: true,
};

describe('validateReservation', () => {
  it('succès : recompute nbJours + total, renvoie une référence LOC-', async () => {
    const res = await validateReservation(base);
    expect(res.success).toBe(true);
    expect(res.reference).toMatch(/^LOC-/);
  });

  it('rejette si dateRetour <= dateDepart', async () => {
    const res = await validateReservation({ ...base, dateRetour: '2099-07-01' });
    expect(res.success).toBe(false);
    expect(res.errors.dateRetour).toBeDefined();
  });

  it('rejette une date de départ passée', async () => {
    const res = await validateReservation({
      ...base,
      dateDepart: '2000-01-01',
      dateRetour: '2000-01-05',
    });
    expect(res.success).toBe(false);
    expect(res.errors.dateDepart).toBeDefined();
  });

  it('rejette une voiture introuvable', async () => {
    const res = await validateReservation({ ...base, locationCarId: 'inconnu' });
    expect(res.success).toBe(false);
    expect(res.errors._form).toBeDefined();
  });

  it('rejette une voiture indisponible', async () => {
    const res = await validateReservation({ ...base, locationCarId: 'renault-trafic' });
    expect(res.success).toBe(false);
    expect(res.errors._form).toBeDefined();
  });

  it('rejette sans consentement', async () => {
    const res = await validateReservation({ ...base, consent: false });
    expect(res.success).toBe(false);
    expect(res.errors.consent).toBeDefined();
  });

  it('rejette un email invalide', async () => {
    const res = await validateReservation({ ...base, email: 'nope' });
    expect(res.success).toBe(false);
    expect(res.errors.email).toBeDefined();
  });
});
