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
    // Les véhicules « vendus » (soft-delete admin) sont retirés du site public :
    // l'admin les voit toujours via getVehicules(), pas les visiteurs.
    return (await adapter.getVehicules()).filter((v) => v.disponibilite !== 'vendu');
  },
  ['vehicules-public'],
  { tags: ['vehicules'] }
);
