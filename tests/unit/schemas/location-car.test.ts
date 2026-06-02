import { describe, it, expect } from 'vitest';
import { parseLocationCar, LocationCarWriteSchema } from '@/lib/schemas/location-car';

const valid = {
  id: 'clio-v',
  marque: 'Renault',
  modele: 'Clio V',
  categorie: 'Citadine',
  places: 5,
  transmission: 'Auto',
  carburant: 'Essence',
  prixJourEnCents: 4500,
  prixSemaineEnCents: 27000,
  disponible: true,
  image: 'https://example.com/clio.webp',
  reference: 'LOC-CLIO-V',
  updatedAt: '2026-06-02T00:00:00.000Z',
};

describe('LocationCarWriteSchema', () => {
  it('parse une voiture valide', () => {
    expect(() => LocationCarWriteSchema.parse(valid)).not.toThrow();
  });

  it('rejette une catégorie inconnue', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, categorie: 'Cabriolet' })).toThrow();
  });

  it('rejette un prix négatif', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, prixJourEnCents: -1 })).toThrow();
  });

  it('rejette un prix non entier (float)', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, prixJourEnCents: 45.5 })).toThrow();
  });

  it('rejette places hors borne (> 9)', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, places: 12 })).toThrow();
  });

  it('rejette marque vide', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, marque: '' })).toThrow();
  });
});

describe('parseLocationCar (lecture)', () => {
  it('renvoie un objet typé et ignore les champs inconnus (ex: deletedAt)', () => {
    const car = parseLocationCar({ ...valid, deletedAt: null });
    expect(car.id).toBe('clio-v');
    expect('deletedAt' in car).toBe(false);
  });
});
