import type { MetadataRoute } from 'next';
import { getAdapter } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { VEHICULES } from '@/lib/vehicules';
import { MOTOS } from '@/lib/motos';
import { SITE_URL as BASE_URL } from '@/lib/seo';
import { isPathVisible } from '@/lib/feature-flags';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Source live products (Phase 5 §9.19) : getProducts() exclut deletedAt
  const adapter = await getAdapter();
  const products = await adapter.getProducts();
  const now = new Date();
  // Sections désactivées (BO) → exclues du sitemap (désindexation propre).
  const flags = await getCachedFeatureFlags();
  const visible = (url: string) => isPathVisible(url.replace(BASE_URL, ''), flags);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/pieces`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    {
      url: `${BASE_URL}/pieces?promo=1`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    { url: `${BASE_URL}/reparation`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/lavage`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/location`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    {
      url: `${BASE_URL}/vente-vehicule`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    { url: `${BASE_URL}/vente-moto`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/panier`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    // NB: /cgv, /confidentialite, /cookies redirigent vers /mentions-legales
    // → exclus du sitemap (Google warning sur les URLs en redirection).
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/pieces?category=${cat.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/pieces/${p.slug}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const vehiculeRoutes: MetadataRoute.Sitemap = VEHICULES.map((v) => ({
    url: `${BASE_URL}/vente-vehicule/${v.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const motoRoutes: MetadataRoute.Sitemap = MOTOS.map((m) => ({
    url: `${BASE_URL}/vente-moto/${m.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...vehiculeRoutes,
    ...motoRoutes,
  ].filter((r) => visible(r.url));
}
