import type { Product, CartItem, VehicleCompatibility } from '@/lib/types';

// Base compatibility entry for reuse
const baseCompatibility: VehicleCompatibility = {
  brand: 'Peugeot',
  model: '208',
  yearFrom: 2012,
  yearTo: 2020,
};

/**
 * Mock Product — standard in-stock product
 */
export const mockProduct: Product = {
  id: 'test-001',
  slug: 'plaquettes-frein-avant-peugeot',
  name: 'Plaquettes de frein avant',
  reference: 'PEU-208-BRK-001',
  description: 'Plaquettes de frein haute performance pour freinage optimal',
  shortDescription: 'Freinage optimal pour Peugeot 208',
  price: 4500, // 45,00 €
  images: ['/images/categories/freinage.svg'],
  category: 'freinage',
  vehicleType: 'auto',
  compatibility: [baseCompatibility],
  stock: 10,
  isPromoted: false,
  createdAt: '2026-01-15T10:00:00Z',
};

/**
 * Mock Product — with promotion
 */
export const mockPromoProduct: Product = {
  ...mockProduct,
  id: 'test-promo-001',
  slug: 'disque-frein-avant-renault',
  name: 'Disques de frein avant premium',
  reference: 'REN-CLO4-DBF-001',
  price: 4500, // 45,00 €
  priceOriginal: 6000, // Originally 60,00 €
  isPromoted: true,
};

/**
 * Mock Product — out of stock
 */
export const mockOutOfStockProduct: Product = {
  ...mockProduct,
  id: 'test-oos-001',
  slug: 'filtre-air-yamaha',
  name: 'Filtre à air moteur',
  reference: 'YAM-MT07-AIR-001',
  category: 'filtres',
  vehicleType: 'moto',
  stock: 0,
};

/**
 * Mock CartItem — based on mockProduct
 */
export const mockCartItem: CartItem = {
  id: mockProduct.id,
  productId: mockProduct.id,
  slug: mockProduct.slug,
  name: mockProduct.name,
  reference: mockProduct.reference,
  price: mockProduct.price,
  quantity: 2,
  image: mockProduct.images[0],
  stock: mockProduct.stock,
};
