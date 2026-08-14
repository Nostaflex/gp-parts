import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import { VehiculeSchema } from '@/lib/schemas/vehicule';
import type { Vehicule } from '@/lib/vehicules';

/**
 * Lecture publique des véhicules, cachée et invalidable par tag.
 * `revalidateTag('vehicules')` (Server Actions admin) purge ce cache →
 * pages publiques ISR régénérées à la demande. Préserve la perf type-SSG
 * et le cache CDN Vercel. `revalidate` = filet : une écriture hors Server
 * Action (console Firebase, seed) ne laisse jamais le site périmé > 1 h.
 */
const cachedRawVehicules = unstable_cache(
  async (): Promise<Vehicule[]> => {
    const adapter = await getAdapter();
    // Les véhicules « vendus » restent affichés publiquement (grisés + bandeau
    // VENDU, non-cliquables) — la présentation gère le tri/état. Seul un hard
    // delete les retirerait. La page détail 404 quand même sur un vendu.
    return adapter.getVehicules();
  },
  ['vehicules-public'],
  { tags: ['vehicules'], revalidate: 3600 }
);

let warnedStale = false;

/**
 * Normalise APRÈS le cache (leçon venteVehicule 2026-08-12) : une valeur
 * sérialisée avant un ajout de champ resterait figée dans le data cache.
 * safeParse fail-open : un item non conforme est rendu tel quel + WARN une
 * fois par instance — jamais de 500 public, jamais de dérive muette.
 */
export async function getCachedVehicules(): Promise<Vehicule[]> {
  return (await cachedRawVehicules()).map((v) => {
    const parsed = VehiculeSchema.safeParse(v);
    // Le schéma sert de DÉTECTEUR, jamais de transformateur : retourner
    // parsed.data strip-erait les champs ajoutés après coup (z.object zod v4
    // strip par défaut) — la dérive muette exacte qu'on chasse (review B3).
    if (!parsed.success && !warnedStale) {
      warnedStale = true;
      console.warn(
        '[vehicules-cache] entrée cache non conforme au schéma (champ ajouté ? donnée ancienne ?) — rendue telle quelle:',
        v?.id,
        parsed.error.issues[0]?.path?.join('.')
      );
    }
    return v;
  });
}
