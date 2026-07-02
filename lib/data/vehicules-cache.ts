import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { Vehicule } from '@/lib/vehicules';

/**
 * Lecture publique des véhicules, cachée et invalidable par tag.
 * `revalidateTag('vehicules')` (Server Actions admin) purge ce cache →
 * pages publiques ISR régénérées à la demande. Préserve la perf type-SSG
 * et le cache CDN Vercel.
 */
export const getCachedVehicules = unstable_cache(
  async (): Promise<Vehicule[]> => {
    const adapter = await getAdapter();
    // Les véhicules « vendus » restent affichés publiquement (grisés + bandeau
    // VENDU, non-cliquables) — la présentation gère le tri/état. Seul un hard
    // delete les retirerait. La page détail 404 quand même sur un vendu.
    return adapter.getVehicules();
  },
  ['vehicules-public'],
  { tags: ['vehicules'] }
);
