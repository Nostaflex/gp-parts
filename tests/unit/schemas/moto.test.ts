import { describe, it, expect } from 'vitest';
import { parseMoto, MotoSchema } from '@/lib/schemas/moto';

const valid = {
  id: 'yamaha-mt07',
  type: 'occasion',
  marque: 'Yamaha',
  modele: 'MT-07',
  annee: 2022,
  km: 12500,
  categorie: 'Roadster',
  energie: 'Essence',
  options: ['ABS'],
  prix: 6900,
  mensualite: 109,
  image: 'https://example.com/a.webp',
  images: ['https://example.com/a.webp'],
  description: 'Bon état.',
  caracteristiques: { puissance: '73 ch', permis: 'A2' },
  reference: 'REF-M1',
  disponibilite: 'disponible',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('MotoSchema', () => {
  it('parse une moto valide', () => {
    expect(() => parseMoto(valid)).not.toThrow();
  });

  it('rejette une année hors borne (avant 1990)', () => {
    expect(() => parseMoto({ ...valid, annee: 1980 })).toThrow();
  });

  it("rejette une année future de plus d'un an", () => {
    const tooFar = new Date().getFullYear() + 2;
    expect(() => parseMoto({ ...valid, annee: tooFar })).toThrow();
  });

  it('rejette plus de 5 images', () => {
    const six = Array(6).fill('https://example.com/x.webp');
    expect(() => parseMoto({ ...valid, images: six })).toThrow();
  });

  it('rejette zéro image', () => {
    expect(() => parseMoto({ ...valid, images: [] })).toThrow();
  });

  it('rejette un prix négatif', () => {
    expect(() => parseMoto({ ...valid, prix: -1 })).toThrow();
  });

  it('rejette un prix non entier', () => {
    expect(() => parseMoto({ ...valid, prix: 6900.5 })).toThrow();
  });

  it('rejette un champ requis manquant (marque)', () => {
    const { marque, ...sansMarque } = valid;
    expect(() => parseMoto(sansMarque)).toThrow();
  });

  it('safeParse expose les erreurs par champ', () => {
    const res = MotoSchema.safeParse({ ...valid, prix: -1, annee: 1980 });
    expect(res.success).toBe(false);
    if (!res.success) {
      const f = res.error.flatten().fieldErrors;
      expect(f.prix).toBeDefined();
      expect(f.annee).toBeDefined();
    }
  });
});
