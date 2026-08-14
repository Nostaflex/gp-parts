import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import { normalizeFeatureFlags } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';

/**
 * Lecture publique des flags de sections, cachée et invalidable par tag.
 * `revalidateTag('feature-flags')` (Server Action BO) purge ce cache →
 * nav/home/footer/routes/sitemap régénérés. Même pattern que getCachedVehicules.
 */
const cachedRawFlags = unstable_cache(
  async (): Promise<FeatureFlags> => {
    const adapter = await getAdapter();
    return adapter.getFeatureFlags();
  },
  ['feature-flags'],
  { tags: ['feature-flags'] }
);

/**
 * Normalise APRÈS le cache : une valeur sérialisée avant l'ajout d'un flag
 * (data cache .next/ ou Vercel, qui survit aux redéploiements) rendrait le
 * nouveau champ `undefined` → section masquée à tort. Vécu avec venteVehicule
 * (2026-08-12) : normaliser en sortie rend tout ajout de flag chain-safe.
 */
export async function getCachedFeatureFlags(): Promise<FeatureFlags> {
  return normalizeFeatureFlags(await cachedRawFlags());
}
