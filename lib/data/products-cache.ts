import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { Product } from '@/lib/types';

/**
 * Lecture publique des produits actifs, cachée et invalidable par tag.
 * `revalidateTag('products')` (Server Actions admin) purge ce cache →
 * pages publiques ISR régénérées à la demande. Préserve la perf type-SSG
 * et le cache CDN Vercel.
 *
 * NB : getProducts() (sans filtres) exclut déjà deletedAt côté adapter
 * (Phase 5 §9.16) — les soft-deleted ne fuitent jamais côté public.
 */
export const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const adapter = await getAdapter();
    return adapter.getProducts();
  },
  ['products-public'],
  { tags: ['products'] }
);
