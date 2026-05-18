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
    return adapter.getMotos();
  },
  ['motos-public'],
  { tags: ['motos'] }
);
