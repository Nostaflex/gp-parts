import { describe, it, expect, beforeEach } from 'vitest';
import { getAdapter, resetAdapter, setAdapter, StaticAdapter } from '../../lib/data';
import type { DataAdapter } from '../../lib/data';
import { applyClientFilters } from '../../lib/data/filters';
import type { Product } from '../../lib/types';

// ─── Mock products pour tester les filtres ───────────────────────────
const mockProducts: Product[] = [
  {
    id: '1',
    slug: 'disque-frein-avant',
    name: 'Disque de frein avant',
    reference: 'PEU-208-DBF-001',
    description: 'Disque de frein avant pour Peugeot 208',
    shortDescription: 'Disque frein avant Peugeot',
    price: 4500,
    images: [],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Peugeot', model: '208', yearFrom: 2015 }],
    stock: 10,
    isPromoted: false,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    slug: 'chaine-mt07',
    name: 'Chaîne de transmission MT-07',
    reference: 'YAM-MT07-CHN-003',
    description: 'Chaîne transmission Yamaha MT-07',
    shortDescription: 'Chaîne Yamaha MT-07',
    price: 8900,
    images: [],
    category: 'transmission',
    vehicleType: 'moto',
    compatibility: [{ brand: 'Yamaha', model: 'MT-07', yearFrom: 2018 }],
    stock: 0,
    isPromoted: true,
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    slug: 'filtre-huile-clio',
    name: 'Filtre à huile Clio IV',
    reference: 'REN-CLO4-FLH-001',
    description: 'Filtre à huile pour Renault Clio IV',
    shortDescription: 'Filtre huile Renault Clio',
    price: 1200,
    images: [],
    category: 'filtres',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }],
    stock: 3,
    isPromoted: false,
    createdAt: '2024-03-01',
  },
];

// ─── getAdapter() singleton ──────────────────────────────────────────
describe('getAdapter', () => {
  beforeEach(() => {
    resetAdapter();
  });

  it('retourne un StaticAdapter par défaut (sans Firebase env vars)', async () => {
    const adapter = await getAdapter();
    expect(adapter).toBeInstanceOf(StaticAdapter);
  });

  it('retourne la même instance au 2e appel (singleton)', async () => {
    const a1 = await getAdapter();
    const a2 = await getAdapter();
    expect(a1).toBe(a2);
  });

  it('setAdapter() injecte un mock adapter', async () => {
    const mockAdapter: DataAdapter = {
      getProducts: async () => [],
      getProductBySlug: async () => null,
      getProductById: async () => null,
      getProductsByCategory: async () => [],
      getPromotedProducts: async () => [],
      getFeaturedProducts: async () => [],
      getCategories: async () => [],
      getBrands: async () => [],
    };
    setAdapter(mockAdapter);
    const adapter = await getAdapter();
    expect(adapter).toBe(mockAdapter);
  });

  it('resetAdapter() permet de recréer une instance', async () => {
    const a1 = await getAdapter();
    resetAdapter();
    const a2 = await getAdapter();
    expect(a1).not.toBe(a2);
  });
});

// ─── StaticAdapter ───────────────────────────────────────────────────
describe('StaticAdapter', () => {
  const adapter = new StaticAdapter();

  it('getProducts() retourne un tableau non-vide', async () => {
    const products = await adapter.getProducts();
    expect(products.length).toBeGreaterThan(0);
  });

  it('getProductBySlug() retourne un produit existant', async () => {
    const products = await adapter.getProducts();
    const first = products[0];
    const found = await adapter.getProductBySlug(first.slug);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(first.id);
  });

  it('getProductBySlug() retourne null pour un slug inexistant', async () => {
    const found = await adapter.getProductBySlug('produit-imaginaire-999');
    expect(found).toBeNull();
  });

  it('getProductById() retourne un produit existant', async () => {
    const products = await adapter.getProducts();
    const first = products[0];
    const found = await adapter.getProductById(first.id);
    expect(found).not.toBeNull();
    expect(found!.slug).toBe(first.slug);
  });

  it('getPromotedProducts() ne retourne que les promos', async () => {
    const promos = await adapter.getPromotedProducts();
    for (const p of promos) {
      expect(p.isPromoted).toBe(true);
    }
  });

  it('getFeaturedProducts() ne retourne que des produits en stock', async () => {
    const featured = await adapter.getFeaturedProducts(4);
    for (const p of featured) {
      expect(p.stock).toBeGreaterThan(0);
    }
    expect(featured.length).toBeLessThanOrEqual(4);
  });

  it('getCategories() retourne des catégories triées', async () => {
    const categories = await adapter.getCategories();
    expect(categories.length).toBeGreaterThan(0);
    const sorted = [...categories].sort();
    expect(categories).toEqual(sorted);
  });
});

// ─── applyClientFilters() ────────────────────────────────────────────
describe('applyClientFilters', () => {
  it('retourne tout sans filtre', () => {
    const result = applyClientFilters(mockProducts);
    expect(result).toHaveLength(3);
  });

  it('filtre par catégorie', () => {
    const result = applyClientFilters(mockProducts, { category: 'freinage' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filtre par vehicleType', () => {
    const result = applyClientFilters(mockProducts, { vehicleType: 'moto' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filtre par recherche (nom)', () => {
    const result = applyClientFilters(mockProducts, { search: 'chaîne' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filtre par recherche (référence)', () => {
    const result = applyClientFilters(mockProducts, { search: 'REN-CLO4' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filtre par prix min', () => {
    const result = applyClientFilters(mockProducts, { minPrice: 5000 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filtre par prix max', () => {
    const result = applyClientFilters(mockProducts, { maxPrice: 2000 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filtre inStock', () => {
    const result = applyClientFilters(mockProducts, { inStock: true });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.stock > 0)).toBe(true);
  });

  it('combine plusieurs filtres', () => {
    const result = applyClientFilters(mockProducts, {
      vehicleType: 'auto',
      minPrice: 2000,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('respecte le paramètre skip', () => {
    const result = applyClientFilters(
      mockProducts,
      { category: 'freinage', vehicleType: 'moto' },
      new Set(['category'] as const)
    );
    // category est skipped → seul vehicleType='moto' s'applique
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});
