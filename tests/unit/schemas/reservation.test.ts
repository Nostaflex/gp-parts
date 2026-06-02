import { describe, it, expect } from 'vitest';
import { parseReservation, reservationSchema } from '@/lib/schemas/reservation';

const valid = {
  id: 'r1',
  reference: 'LOC-ABC-1234',
  status: 'nouvelle',
  locationCarId: 'clio-v',
  carLabel: 'Renault Clio V',
  dateDepart: '2026-07-01',
  dateRetour: '2026-07-05',
  nbJours: 4,
  prixJourEnCents: 4500,
  totalEnCents: 18000,
  customer: {
    prenom: 'Marie',
    nom: 'Dupont',
    email: 'marie@example.com',
    telephone: '0690123456',
    permis: '123456789',
  },
  createdAt: '2026-06-02T00:00:00.000Z',
  updatedAt: '2026-06-02T00:00:00.000Z',
  expiresAt: 1800000000000,
};

describe('reservationSchema', () => {
  it('parse une réservation valide', () => {
    expect(() => reservationSchema.parse(valid)).not.toThrow();
  });

  it('rejette un statut inconnu', () => {
    expect(() => reservationSchema.parse({ ...valid, status: 'wip' })).toThrow();
  });

  it('accepte les 5 statuts', () => {
    for (const status of ['nouvelle', 'confirmee', 'en_cours', 'terminee', 'annulee']) {
      expect(() => reservationSchema.parse({ ...valid, status })).not.toThrow();
    }
  });

  it('rejette nbJours < 1', () => {
    expect(() => reservationSchema.parse({ ...valid, nbJours: 0 })).toThrow();
  });

  it('rejette un total non entier', () => {
    expect(() => reservationSchema.parse({ ...valid, totalEnCents: 1.5 })).toThrow();
  });

  it('rejette un email client invalide', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, customer: { ...valid.customer, email: 'nope' } })
    ).toThrow();
  });

  it('parseReservation strip les champs inconnus', () => {
    const r = parseReservation({ ...valid, deletedAt: null });
    expect(r.reference).toBe('LOC-ABC-1234');
    expect('deletedAt' in r).toBe(false);
  });
});
