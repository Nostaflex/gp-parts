import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import { MotoSchema } from '@/lib/schemas/moto';
import type { Moto } from '@/lib/motos';

/**
 * Lecture publique des motos, cachée et invalidable par tag.
 * `revalidateTag('motos')` (Server Actions admin) purge ce cache →
 * pages publiques ISR régénérées à la demande. Préserve la perf type-SSG
 * et le cache CDN Vercel. `revalidate` = filet : une écriture hors Server
 * Action (console Firebase, seed) ne laisse jamais le site périmé > 1 h.
 */
const cachedRawMotos = unstable_cache(
  async (): Promise<Moto[]> => {
    const adapter = await getAdapter();
    // Les motos « vendues » restent affichées publiquement (grisées + bandeau
    // VENDU, non-cliquables) — la présentation gère le tri/état. Seul un hard
    // delete les retirerait. La page détail 404 quand même sur une vendue.
    return adapter.getMotos();
  },
  ['motos-public'],
  { tags: ['motos'], revalidate: 3600 }
);

let warnedStale = false;

/**
 * Normalise APRÈS le cache (leçon venteVehicule 2026-08-12) : une valeur
 * sérialisée avant un ajout de champ resterait figée dans le data cache.
 * safeParse fail-open : un item non conforme est rendu tel quel + WARN une
 * fois par instance — jamais de 500 public, jamais de dérive muette.
 */
export async function getCachedMotos(): Promise<Moto[]> {
  return (await cachedRawMotos()).map((m) => {
    const parsed = MotoSchema.safeParse(m);
    if (parsed.success) return parsed.data;
    if (!warnedStale) {
      warnedStale = true;
      console.warn(
        '[motos-cache] entrée cache non conforme au schéma (champ ajouté ? donnée ancienne ?) — rendue telle quelle:',
        m?.id,
        parsed.error.issues[0]?.path?.join('.')
      );
    }
    return m;
  });
}
