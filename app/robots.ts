import type { MetadataRoute } from 'next';
import { SITE_URL as BASE_URL } from '@/lib/seo';

/**
 * SEO lot 1 (2026-10-11, P1.1 de l'audit du 19/08) : /panier et /commande ne
 * sont plus bloqués ici — bloquer le crawl empêchait les moteurs de lire leur
 * noindex, et elles restaient indexées. Le noindex (meta + X-Robots-Tag) fait
 * foi. /admin reste bloqué sauf la page de connexion, déjà indexée, que les
 * moteurs doivent pouvoir relire pour la désindexer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/admin/login'],
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
