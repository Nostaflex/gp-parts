import { unstable_cache } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeLavageSettings } from '@/lib/lavage-settings';
import type { LavageSettings } from '@/lib/lavage-settings';

/**
 * Formules lavage publiques, cachées et invalidables par tag.
 * `revalidateTag('lavage-settings')` (action BO) régénère /lavage.
 * `revalidate` = filet : une écriture hors Server Action ne laisse jamais
 * le site périmé > 1 h. Normalisation EN SORTIE (leçon venteVehicule) :
 * une valeur sérialisée ancienne ne casse jamais la page publique.
 * Node runtime uniquement (Admin SDK) — /lavage est un Server Component.
 */
const cachedRawLavageSettings = unstable_cache(
  async (): Promise<unknown> => {
    const snap = await getAdminFirestore().doc('meta/lavageSettings').get();
    return snap.exists ? snap.data() : null;
  },
  ['lavage-settings'],
  { tags: ['lavage-settings'], revalidate: 3600 }
);

let warnedFail = false;

export async function getCachedLavageSettings(): Promise<LavageSettings> {
  // Fail-open : /lavage ne meurt JAMAIS sur cette lecture (credentials
  // absents au build CI, quota, réseau) — défauts + WARN, jamais un crash.
  // Vécu 2026-08-14 : la CI GitHub prérend /lavage sans env Firebase Admin.
  try {
    return normalizeLavageSettings(await cachedRawLavageSettings());
  } catch (err) {
    if (!warnedFail) {
      warnedFail = true;
      console.warn('[lavage-settings-cache] lecture échouée (fail-open, défauts):', err);
    }
    return normalizeLavageSettings(null);
  }
}
