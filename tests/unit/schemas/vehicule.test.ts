import { describe, it, expect } from 'vitest';
import { parseVehicule, VehiculeSchema } from '@/lib/schemas/vehicule';

const valid = {
  id: 'peugeot-308sw',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '308 SW GT Line',
  annee: 2021,
  km: 42000,
  energie: 'Diesel',
  transmission: 'BVA',
  places: 5,
  options: ['Climatisation', 'GPS'],
  prix: 18900,
  mensualite: 289,
  image: 'https://example.com/a.webp',
  images: ['https://example.com/a.webp'],
  description: 'Très bon état.',
  caracteristiques: { puissance: '130 ch' },
  reference: 'REF-001',
  disponibilite: 'disponible',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('VehiculeSchema', () => {
  it('parse un véhicule valide', () => {
    expect(() => parseVehicule(valid)).not.toThrow();
  });

  it('rejette une année hors borne (avant 1990)', () => {
    expect(() => parseVehicule({ ...valid, annee: 1980 })).toThrow();
  });

  it("rejette une année future de plus d'un an", () => {
    const tooFar = new Date().getFullYear() + 2;
    expect(() => parseVehicule({ ...valid, annee: tooFar })).toThrow();
  });

  it('rejette plus de 5 images', () => {
    const six = Array(6).fill('https://example.com/x.webp');
    expect(() => parseVehicule({ ...valid, images: six })).toThrow();
  });

  it('rejette zéro image', () => {
    expect(() => parseVehicule({ ...valid, images: [] })).toThrow();
  });

  it('rejette un prix négatif', () => {
    expect(() => parseVehicule({ ...valid, prix: -1 })).toThrow();
  });

  it('rejette un prix non entier', () => {
    expect(() => parseVehicule({ ...valid, prix: 18900.5 })).toThrow();
  });

  it('rejette un champ requis manquant (marque)', () => {
    const { marque, ...sansMarque } = valid;
    expect(() => parseVehicule(sansMarque)).toThrow();
  });

  it('safeParse expose les erreurs par champ', () => {
    const res = VehiculeSchema.safeParse({ ...valid, prix: -1, annee: 1980 });
    expect(res.success).toBe(false);
    if (!res.success) {
      const f = res.error.flatten().fieldErrors;
      expect(f.prix).toBeDefined();
      expect(f.annee).toBeDefined();
    }
  });
});
