import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { FeatureFlags } from '@/lib/feature-flags';

/**
 * Lecture publique des flags de sections, cachée et invalidable par tag.
 * `revalidateTag('feature-flags')` (Server Action BO) purge ce cache →
 * nav/home/footer/routes/sitemap régénérés. Même pattern que getCachedVehicules.
 */
export const getCachedFeatureFlags = unstable_cache(
  async (): Promise<FeatureFlags> => {
    const adapter = await getAdapter();
    return adapter.getFeatureFlags();
  },
  ['feature-flags'],
  { tags: ['feature-flags'] }
);
