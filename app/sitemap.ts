import type { MetadataRoute } from 'next';
import { getAdapter } from '@/lib/data';
import { getCachedVehicules } from '@/lib/data/vehicules-cache';
import { getCachedMotos } from '@/lib/data/motos-cache';
import { SITE_URL as BASE_URL } from '@/lib/seo';
import { isPathVisible } from '@/lib/feature-flags';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';

/**
 * Sitemap = l'inventaire réel, rien d'autre (SEO lot 1, 2026-10-11 ; P1.3 de
 * l'audit du 19/08) :
 * - véhicules et motos lus dans Firestore via les mêmes caches que les pages,
 *   sans les fiches vendues (elles répondent 404) ;
 * - aucune URL privée (/panier) ni facette (?category=, ?promo=) : les filtres
 *   du catalogue sont une UX, consolidée vers /pieces (arbitrage du 11/10) ;
 * - lastModified = updatedAt réel ; les pages statiques ne sont pas datées
 *   « maintenant » à chaque génération ;
 * - les actions du BO appellent revalidatePath('/sitemap.xml') à chaque mutation.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const adapter = await getAdapter();
  const [products, vehicules, motos, flags] = await Promise.all([
    adapter.getProducts(), // exclut deletedAt (Phase 5 §9.19)
    getCachedVehicules(),
    getCachedMotos(),
    getCachedFeatureFlags(),
  ]);
  // Sections désactivées (BO) → exclues du sitemap (désindexation propre).
  const visible = (url: string) => isPathVisible(url.replace(BASE_URL, ''), flags);
  const dated = (iso?: string) => (iso ? new Date(iso) : undefined);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/pieces`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/reparation`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/lavage`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/avis`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/location`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/vente-vehicule`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/vente-moto`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    // NB: /cgv, /confidentialite, /cookies redirigent (308) vers /mentions-legales.
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/pieces/${p.slug}`,
    lastModified: dated(p.updatedAt ?? p.createdAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const vehiculeRoutes: MetadataRoute.Sitemap = vehicules
    .filter((v) => v.disponibilite !== 'vendu')
    .map((v) => ({
      url: `${BASE_URL}/vente-vehicule/${v.id}`,
      lastModified: dated(v.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const motoRoutes: MetadataRoute.Sitemap = motos
    .filter((m) => m.disponibilite !== 'vendu')
    .map((m) => ({
      url: `${BASE_URL}/vente-moto/${m.id}`,
      lastModified: dated(m.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...staticRoutes, ...productRoutes, ...vehiculeRoutes, ...motoRoutes].filter((r) =>
    visible(r.url)
  );
}
