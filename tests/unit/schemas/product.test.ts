import { describe, it, expect } from 'vitest';
import { ProductWriteSchema, ProductSchema, COMPAT_MAX } from '@/lib/schemas/product';

const validWrite = {
  name: 'Plaquettes avant',
  reference: 'REN-CLO4-DBF-001',
  description: 'desc',
  shortDescription: 'court',
  price: 6500,
  priceOriginal: 8000,
  images: ['https://firebasestorage.googleapis.com/x.webp'],
  category: 'freinage',
  vehicleType: 'auto',
  compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }],
  stock: 12,
  isPromoted: false,
};

it('accepte un write valide', () => {
  expect(ProductWriteSchema.safeParse(validWrite).success).toBe(true);
});
it('REJETTE une clé inconnue (anti-mass-assignment)', () => {
  expect(ProductWriteSchema.safeParse({ ...validWrite, hacked: 1 }).success).toBe(false);
});
it('REJETTE les champs server-only injectés', () => {
  for (const k of ['id', 'slug', 'createdAt', 'updatedAt', 'deletedAt']) {
    expect(ProductWriteSchema.safeParse({ ...validWrite, [k]: 'x' }).success).toBe(false);
  }
});
it('price: rejette négatif, non-entier, > cap 1M€', () => {
  expect(ProductWriteSchema.safeParse({ ...validWrite, price: -1 }).success).toBe(false);
  expect(ProductWriteSchema.safeParse({ ...validWrite, price: 19.99 }).success).toBe(false);
  expect(ProductWriteSchema.safeParse({ ...validWrite, price: 100_000_01 }).success).toBe(false);
});
it('strings: rejette au-dessus des caps', () => {
  expect(ProductWriteSchema.safeParse({ ...validWrite, name: 'a'.repeat(201) }).success).toBe(
    false
  );
  expect(
    ProductWriteSchema.safeParse({ ...validWrite, description: 'a'.repeat(5001) }).success
  ).toBe(false);
});
it('images: rejette non-url, host hors allowlist, > 8', () => {
  expect(
    ProductWriteSchema.safeParse({ ...validWrite, images: ['javascript:alert(1)'] }).success
  ).toBe(false);
  expect(ProductWriteSchema.safeParse({ ...validWrite, images: ['http://evil/x'] }).success).toBe(
    false
  );
  expect(
    ProductWriteSchema.safeParse({
      ...validWrite,
      images: Array(9).fill('https://firebasestorage.googleapis.com/x'),
    }).success
  ).toBe(false);
});
it('compatibility: rejette > COMPAT_MAX et yearTo<yearFrom', () => {
  expect(COMPAT_MAX).toBe(50);
  const big = Array(51).fill({ brand: 'B', model: 'M', yearFrom: 2010 });
  expect(ProductWriteSchema.safeParse({ ...validWrite, compatibility: big }).success).toBe(false);
  expect(
    ProductWriteSchema.safeParse({
      ...validWrite,
      compatibility: [{ brand: 'B', model: 'M', yearFrom: 2020, yearTo: 2010 }],
    }).success
  ).toBe(false);
});
it('ProductSchema (read) accepte un doc complet avec updatedAt+deletedAt', () => {
  expect(
    ProductSchema.safeParse({
      ...validWrite,
      id: 'p1',
      slug: 'plaquettes',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      deletedAt: null,
    }).success
  ).toBe(true);
});
