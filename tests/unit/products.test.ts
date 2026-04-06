import { describe, it, expect } from 'vitest';
import { PRODUCTS } from '../../lib/products';

/**
 * Tests unitaires sur le catalogue de produits statique.
 * Vérifie la cohérence des données démo.
 */
describe('PRODUCTS — catalogue statique', () => {
  it('contient au moins 1 produit', () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);
  });

  it('chaque produit a un id unique', () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque produit a un slug unique', () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('chaque produit a un prix > 0 (en centimes)', () => {
    for (const p of PRODUCTS) {
      expect(p.price).toBeGreaterThan(0);
      expect(Number.isInteger(p.price)).toBe(true);
    }
  });

  it('chaque produit a un stock >= 0', () => {
    for (const p of PRODUCTS) {
      expect(p.stock).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(p.stock)).toBe(true);
    }
  });

  it('chaque produit a un nom et une référence non vides', () => {
    for (const p of PRODUCTS) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.reference.length).toBeGreaterThan(0);
    }
  });

  it('chaque produit a une catégorie non vide', () => {
    for (const p of PRODUCTS) {
      expect(p.category.length).toBeGreaterThan(0);
      // Pas de majuscules ni espaces dans les catégories (convention slug)
      expect(p.category).toMatch(/^[a-z]+$/);
    }
  });

  it('chaque produit a un vehicleType auto ou moto', () => {
    for (const p of PRODUCTS) {
      expect(['auto', 'moto']).toContain(p.vehicleType);
    }
  });

  it('chaque produit a au moins 1 image', () => {
    for (const p of PRODUCTS) {
      expect(p.images.length).toBeGreaterThan(0);
    }
  });

  it('chaque produit a un slug URL-safe (pas de majuscules ni espaces)', () => {
    for (const p of PRODUCTS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
