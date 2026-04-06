import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  slugify,
  productSlug,
  generateOrderNumber,
  cn,
  LOW_STOCK_THRESHOLD,
  getStockStatus,
  getStockLabel,
} from '../../lib/utils';

// ─── formatPrice ─────────────────────────────────────────────────────
describe('formatPrice', () => {
  it('formate 6500 centimes en "65,00 €"', () => {
    const result = formatPrice(6500);
    // Intl peut utiliser un espace insécable avant € — on normalise
    expect(result.replace(/\s/g, ' ')).toBe('65,00 €');
  });

  it('formate 0 centimes en "0,00 €"', () => {
    const result = formatPrice(0);
    expect(result.replace(/\s/g, ' ')).toBe('0,00 €');
  });

  it('formate 150 centimes en "1,50 €"', () => {
    const result = formatPrice(150);
    expect(result.replace(/\s/g, ' ')).toBe('1,50 €');
  });

  it('retourne "—" pour NaN', () => {
    expect(formatPrice(NaN)).toBe('—');
  });

  it('retourne "—" pour Infinity', () => {
    expect(formatPrice(Infinity)).toBe('—');
  });

  it('clampe les valeurs négatives à 0', () => {
    const result = formatPrice(-500);
    expect(result.replace(/\s/g, ' ')).toBe('0,00 €');
  });

  it('arrondit les fractions résiduelles', () => {
    const result = formatPrice(6543.7);
    expect(result.replace(/\s/g, ' ')).toBe('65,44 €');
  });

  it('supporte une devise différente (USD)', () => {
    const result = formatPrice(1000, 'USD');
    // En fr-FR, USD s'affiche "10,00 $US" ou similaire
    expect(result).toContain('10,00');
  });
});

// ─── slugify ─────────────────────────────────────────────────────────
describe('slugify', () => {
  it('convertit en minuscules et remplace les espaces', () => {
    expect(slugify('Disque de frein avant')).toBe('disque-de-frein-avant');
  });

  it('supprime les accents', () => {
    expect(slugify('Pièce détachée')).toBe('piece-detachee');
  });

  it('supprime les caractères spéciaux', () => {
    expect(slugify('Plaquettes (avant) #2')).toBe('plaquettes-avant-2');
  });

  it('supprime les tirets en début/fin', () => {
    expect(slugify('-test-')).toBe('test');
  });

  it('gère une chaîne vide', () => {
    expect(slugify('')).toBe('');
  });
});

// ─── productSlug ─────────────────────────────────────────────────────
describe('productSlug', () => {
  it('combine nom et marque', () => {
    expect(productSlug('Disque de frein avant', 'Peugeot')).toBe(
      'disque-de-frein-avant-peugeot'
    );
  });
});

// ─── generateOrderNumber ─────────────────────────────────────────────
describe('generateOrderNumber', () => {
  it('commence par GP-', () => {
    expect(generateOrderNumber()).toMatch(/^GP-/);
  });

  it('contient un timestamp et un random séparés par un tiret', () => {
    const order = generateOrderNumber();
    const parts = order.split('-');
    // Format: GP-XXXXX-YYYY
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('GP');
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBe(4);
  });

  it('génère des IDs uniques', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderNumber()));
    // Sur 100 générations, toutes doivent être uniques
    expect(ids.size).toBe(100);
  });
});

// ─── cn ──────────────────────────────────────────────────────────────
describe('cn', () => {
  it('concatène des classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filtre les valeurs falsy', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('retourne une chaîne vide si tout est falsy', () => {
    expect(cn(false, undefined, null)).toBe('');
  });
});

// ─── getStockStatus & getStockLabel ──────────────────────────────────
describe('getStockStatus', () => {
  it('retourne "out-of-stock" pour stock = 0', () => {
    expect(getStockStatus(0)).toBe('out-of-stock');
  });

  it('retourne "low-stock" pour stock entre 1 et seuil', () => {
    expect(getStockStatus(1)).toBe('low-stock');
    expect(getStockStatus(LOW_STOCK_THRESHOLD)).toBe('low-stock');
  });

  it('retourne "in-stock" au-dessus du seuil', () => {
    expect(getStockStatus(LOW_STOCK_THRESHOLD + 1)).toBe('in-stock');
  });
});

describe('getStockLabel', () => {
  it('retourne "Rupture" pour stock 0', () => {
    expect(getStockLabel(0)).toBe('Rupture');
  });

  it('retourne "Plus que X" pour stock bas', () => {
    expect(getStockLabel(3)).toBe('Plus que 3');
  });

  it('retourne "En stock" pour stock normal', () => {
    expect(getStockLabel(20)).toBe('En stock');
  });
});
