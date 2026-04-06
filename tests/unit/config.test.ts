import { describe, it, expect } from 'vitest';
import {
  VAT_RATE,
  CURRENCY,
  LOCALE,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  LOW_STOCK_THRESHOLD,
  ORDER_PREFIX,
  STORAGE_KEYS,
} from '../../lib/config';

/**
 * Tests unitaires sur la configuration métier.
 * Vérifie les invariants business.
 */
describe('config — constantes métier', () => {
  it('TVA Guadeloupe = 8.5%', () => {
    expect(VAT_RATE).toBe(0.085);
  });

  it('devise EUR', () => {
    expect(CURRENCY).toBe('EUR');
  });

  it('locale fr-FR', () => {
    expect(LOCALE).toBe('fr-FR');
  });

  it('frais de livraison est un entier >= 0 (centimes)', () => {
    expect(DELIVERY_FEE).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(DELIVERY_FEE)).toBe(true);
  });

  it('seuil livraison gratuite est un entier >= 0 (centimes)', () => {
    expect(FREE_DELIVERY_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(FREE_DELIVERY_THRESHOLD)).toBe(true);
  });

  it('seuil stock faible est un entier positif', () => {
    expect(LOW_STOCK_THRESHOLD).toBeGreaterThan(0);
    expect(Number.isInteger(LOW_STOCK_THRESHOLD)).toBe(true);
  });

  it('préfixe commande = GP', () => {
    expect(ORDER_PREFIX).toBe('GP');
  });

  it('clés localStorage sont préfixées gpparts-', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(key).toMatch(/^gpparts-/);
    }
  });
});
