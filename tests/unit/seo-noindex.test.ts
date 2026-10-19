import { describe, it, expect } from 'vitest';

import { metadata as adminMetadata } from '@/app/admin/layout';
import { metadata as checkoutMetadata } from '@/app/(boutique)/(checkout)/layout';
import robots from '@/app/robots';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextConfig = require('../../next.config.js') as {
  headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>;
  redirects: () => Promise<{ source: string; destination: string; permanent: boolean }[]>;
};

/**
 * Lot 1 SEO (plan du 2026-10-11, P1.1 de l'audit du 19/08) : les surfaces
 * privées ne doivent jamais être indexées — meta robots dans les layouts ET
 * en-tête X-Robots-Tag, et robots.txt ne doit plus empêcher de lire ce noindex
 * sur /panier et /commande.
 */
describe('surfaces privées : noindex', () => {
  it('layout admin et layout checkout déclarent noindex,nofollow', () => {
    expect(adminMetadata.robots).toEqual({ index: false, follow: false });
    expect(checkoutMetadata.robots).toEqual({ index: false, follow: false });
  });

  it('en-tête X-Robots-Tag sur /admin, /panier, /commande, /compte', async () => {
    const rules = await nextConfig.headers();
    const xRobots = (source: string) =>
      rules
        .filter((r) => r.source === source)
        .flatMap((r) => r.headers)
        .find((h) => h.key === 'X-Robots-Tag')?.value;
    for (const source of [
      '/admin',
      '/admin/:path*',
      '/panier',
      '/commande/:path*',
      '/compte/:path*',
    ]) {
      expect(xRobots(source), source).toBe('noindex, nofollow');
    }
    // Les pages publiques ne reçoivent pas l'en-tête.
    expect(xRobots('/(.*)')).toBeUndefined();
  });

  it('robots.txt : /panier et /commande ne sont plus bloqués (le noindex doit être lisible), /admin/login lisible', () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    const disallow = ([] as string[]).concat(rule.disallow ?? []);
    const allow = ([] as string[]).concat(rule.allow ?? []);
    expect(disallow).not.toContain('/panier');
    expect(disallow).not.toContain('/commande');
    expect(disallow).toContain('/api');
    expect(allow).toContain('/admin/login');
  });
});

describe('redirections légales en 308 (P2.4)', () => {
  it('/cgv, /cookies, /confidentialite → /mentions-legales, permanentes', async () => {
    const redirects = await nextConfig.redirects();
    for (const source of ['/cgv', '/cookies', '/confidentialite']) {
      const r = redirects.find((x) => x.source === source);
      expect(r, source).toBeDefined();
      expect(r?.destination).toBe('/mentions-legales');
      expect(r?.permanent).toBe(true);
    }
  });
});
