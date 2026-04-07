import type { Product } from '@/lib/types';
import { PRODUCTS } from '@/lib/products';
import type { DataAdapter, ProductFilters } from './types';
import { applyClientFilters } from './filters';

/**
 * StaticAdapter — Implements DataAdapter using in-memory PRODUCTS array
 * This serves as the default adapter before migrating to Firestore.
 * Wraps existing helper functions (getProductBySlug, etc.) in async functions.
 */
export class StaticAdapter implements DataAdapter {
  /**
   * Get all products, optionally filtered by various criteria
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    return applyClientFilters([...PRODUCTS], filters);
  }

  /**
   * Get a single product by its slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = PRODUCTS.find((p) => p.slug === slug);
    return product || null;
  }

  /**
   * Get a single product by its ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const product = PRODUCTS.find((p) => p.id === id);
    return product || null;
  }

  /**
   * Get all products in a specific category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.category === category);
  }

  /**
   * Get all products marked as promoted
   */
  async getPromotedProducts(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.isPromoted);
  }

  /**
   * Get featured products (in stock, limited by count)
   */
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.stock > 0).slice(0, limit);
  }

  /**
   * Get all unique product categories
   */
  async getCategories(): Promise<string[]> {
    const categories = new Set(PRODUCTS.map((p) => p.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all unique brands from product compatibility data
   */
  async getBrands(): Promise<string[]> {
    const brands = new Set<string>();
    PRODUCTS.forEach((p) => {
      p.compatibility.forEach((compat) => {
        brands.add(compat.brand);
      });
    });
    return Array.from(brands).sort();
  }
}
