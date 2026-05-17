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
    return adapter.getVehicules();
  },
  ['vehicules-public'],
  { tags: ['vehicules'] }
);
