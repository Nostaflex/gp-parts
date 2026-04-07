import type { Product } from '@/lib/types';
import type { ProductFilters } from './types';

/**
 * Applique les filtres client-side sur un tableau de produits.
 *
 * Extraite pour être partagée entre StaticAdapter et FirebaseAdapter,
 * évitant la duplication de logique de filtrage.
 *
 * @param products — tableau source (non muté)
 * @param filters — critères optionnels
 * @param skip — ensemble de clés de filtre déjà appliquées (ex: par Firestore query)
 */
export function applyClientFilters(
  products: Product[],
  filters?: ProductFilters,
  skip: Set<keyof ProductFilters> = new Set()
): Product[] {
  if (!filters) return products;

  let results = products;

  if (filters.category && !skip.has('category')) {
    results = results.filter((p) => p.category === filters.category);
  }

  if (filters.vehicleType && !skip.has('vehicleType')) {
    results = results.filter((p) => p.vehicleType === filters.vehicleType);
  }

  if (filters.search && !skip.has('search')) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
    );
  }

  if (filters.minPrice !== undefined && !skip.has('minPrice')) {
    results = results.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined && !skip.has('maxPrice')) {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.inStock && !skip.has('inStock')) {
    results = results.filter((p) => p.stock > 0);
  }

  return results;
}
