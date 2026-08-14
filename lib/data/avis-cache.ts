import { unstable_cache } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeAvisList } from '@/lib/avis';
import type { Avis } from '@/lib/avis';

/**
 * Avis PUBLIÉS (lecture publique), cachés et invalidables par tag.
 * `revalidateTag('avis')` (modération BO) régénère home + /avis.
 * Seuls les publiés sortent d'ici — les 'nouveau'/'rejete' et l'email du
 * déposant ne quittent jamais le serveur. Normalisation en sortie + TTL filet.
 */
const cachedRawAvisPublies = unstable_cache(
  async (): Promise<unknown[]> => {
    const snap = await getAdminFirestore()
      .collection('avis')
      .where('status', '==', 'publie')
      .orderBy('publishedAt', 'desc')
      .limit(12)
      .get();
    // Projection explicite : ne JAMAIS embarquer l'email dans le cache public.
    return snap.docs.map((d) => {
      const { email: _email, ...rest } = d.data();
      return { ...rest, id: d.id };
    });
  },
  ['avis-publies'],
  { tags: ['avis'], revalidate: 3600 }
);

let warnedFail = false;

export async function getCachedAvisPublies(): Promise<Avis[]> {
  // Fail-open : la HOME ne doit jamais tomber à cause des avis (index
  // manquant, quota, réseau). Zéro avis affiché + WARN — jamais un 500.
  try {
    return normalizeAvisList(await cachedRawAvisPublies()).filter((a) => a.status === 'publie');
  } catch (err) {
    if (!warnedFail) {
      warnedFail = true;
      console.warn('[avis-cache] lecture des avis publiés échouée (fail-open, section vide):', err);
    }
    return [];
  }
}
