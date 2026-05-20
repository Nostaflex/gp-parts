'use server';

import { getAdapter } from '@/lib/data';

/**
 * Minimal product snapshot pour rehydrater le panier client.
 * Source = adapter live (getProducts() exclut deletedAt côté §9.16 + filters).
 * Phase 5 §9.19-20 : pas de lecture statique PRODUCTS depuis le client —
 * un produit supprimé OU stock===0 ne doit pas ressusciter ses prix/nom
 * depuis localStorage.
 */
export interface ActiveCartProduct {
  id: string;
  slug: string;
  name: string;
  reference: string;
  price: number;
  image: string;
  stock: number;
}

export async function getActiveProductsForCart(): Promise<ActiveCartProduct[]> {
  const adapter = await getAdapter();
  const products = await adapter.getProducts(); // exclut deletedAt
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    reference: p.reference,
    price: p.price,
    image: p.images[0] || '',
    stock: p.stock,
  }));
}
