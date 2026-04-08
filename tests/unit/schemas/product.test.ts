import { describe, it, expect } from 'vitest';
import { parseProduct, productSchema } from '@/lib/schemas/product';

describe('productSchema', () => {
  const validProduct = {
    id: 'prod-001',
    slug: 'plaquettes-frein-clio-iv',
    name: 'Plaquettes de frein Clio IV',
    reference: 'REN-CLO4-DBF-001',
    description: 'Plaquettes de frein avant pour Renault Clio IV',
    shortDescription: 'Plaquettes frein avant',
    price: 2990,
    images: ['/images/plaquettes.jpg'],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }],
    stock: 15,
    isPromoted: false,
    createdAt: '2025-01-15T10:00:00Z',
  };

  it('parses a valid product', () => {
    const result = parseProduct(validProduct);
    expect(result.id).toBe('prod-001');
    expect(result.price).toBe(2990);
  });

  it('accepts optional priceOriginal', () => {
    const result = parseProduct({ ...validProduct, priceOriginal: 3990 });
    expect(result.priceOriginal).toBe(3990);
  });

  it('throws on missing required field', () => {
    const { name, ...incomplete } = validProduct;
    expect(() => parseProduct(incomplete)).toThrow();
  });

  it('throws on price as float', () => {
    expect(() => parseProduct({ ...validProduct, price: 29.9 })).toThrow();
  });

  it('throws on invalid category', () => {
    expect(() => parseProduct({ ...validProduct, category: 'invalid' })).toThrow();
  });

  it('throws on negative stock', () => {
    expect(() => parseProduct({ ...validProduct, stock: -1 })).toThrow();
  });
});
