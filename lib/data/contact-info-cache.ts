import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import { normalizeContactInfo } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';

/**
 * Coordonnées publiques, cachées et invalidables par tag.
 * `revalidateTag('contact-info')` (action BO) régénère footer/contact/fiches/JSON-LD.
 */
const cachedRawContactInfo = unstable_cache(
  async (): Promise<ContactInfo> => {
    const adapter = await getAdapter();
    return adapter.getContactInfo();
  },
  ['contact-info'],
  // revalidate = filet : une écriture hors Server Action (console Firebase)
  // ne laisse jamais le site périmé > 1 h. Le tag reste le chemin rapide.
  { tags: ['contact-info'], revalidate: 3600 }
);

/**
 * Normalise APRÈS le cache : une valeur sérialisée avant l'ajout d'un champ
 * (data cache .next/ ou Vercel) le rendrait `undefined` chez les lecteurs.
 * Même leçon que feature-flags-cache (venteVehicule, 2026-08-12).
 */
export async function getCachedContactInfo(): Promise<ContactInfo> {
  return normalizeContactInfo(await cachedRawContactInfo());
}
