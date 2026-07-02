import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { Moto } from '@/lib/motos';

/**
 * Lecture publique des motos, cachée et invalidable par tag.
 * `revalidateTag('motos')` (Server Actions admin) purge ce cache →
 * pages publiques ISR régénérées à la demande. Préserve la perf type-SSG
 * et le cache CDN Vercel.
 */
export const getCachedMotos = unstable_cache(
  async (): Promise<Moto[]> => {
    const adapter = await getAdapter();
    // Les motos « vendues » restent affichées publiquement (grisées + bandeau
    // VENDU, non-cliquables) — la présentation gère le tri/état. Seul un hard
    // delete les retirerait. La page détail 404 quand même sur une vendue.
    return adapter.getMotos();
  },
  ['motos-public'],
  { tags: ['motos'] }
);
