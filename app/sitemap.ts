import type { MetadataRoute } from 'next';
import { PRODUCTS } from '@/lib/products';
import { CATEGORIES } from '@/lib/categories';

// URL de base : pilotée par env (production) avec fallback dev
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gpparts.gp').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogue`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    {
      url: `${BASE_URL}/catalogue?promo=1`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    { url: `${BASE_URL}/panier`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    { url: `${BASE_URL}/cgv`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    {
      url: `${BASE_URL}/confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    { url: `${BASE_URL}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/catalogue?category=${cat.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${BASE_URL}/catalogue/${p.slug}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
