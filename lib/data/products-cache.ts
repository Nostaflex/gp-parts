import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import { ProductSchema } from '@/lib/schemas/product';
import type { Product } from '@/lib/types';

/**
 * Lecture publique des produits actifs, cachée et invalidable par tag.
 * `revalidateTag('products')` (Server Actions admin) purge ce cache →
 * pages publiques ISR régénérées à la demande. Préserve la perf type-SSG
 * et le cache CDN Vercel. `revalidate` = filet : une écriture hors Server
 * Action (console Firebase, seed) ne laisse jamais le site périmé > 1 h.
 *
 * NB : getProducts() (sans filtres) exclut déjà deletedAt côté adapter
 * (Phase 5 §9.16) — les soft-deleted ne fuitent jamais côté public.
 */
const cachedRawProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const adapter = await getAdapter();
    return adapter.getProducts();
  },
  ['products-public'],
  { tags: ['products'], revalidate: 3600 }
);

let warnedStale = false;

/**
 * Normalise APRÈS le cache (leçon venteVehicule 2026-08-12) : une valeur
 * sérialisée avant un ajout de champ resterait figée dans le data cache.
 * safeParse fail-open : un item non conforme est rendu tel quel + WARN une
 * fois par instance — jamais de 500 public, jamais de dérive muette.
 */
export async function getCachedProducts(): Promise<Product[]> {
  return (await cachedRawProducts()).map((p) => {
    const parsed = ProductSchema.safeParse(p);
    if (parsed.success) return parsed.data;
    if (!warnedStale) {
      warnedStale = true;
      console.warn(
        '[products-cache] entrée cache non conforme au schéma (champ ajouté ? donnée ancienne ?) — rendue telle quelle:',
        p?.id,
        parsed.error.issues[0]?.path?.join('.')
      );
    }
    return p;
  });
}
