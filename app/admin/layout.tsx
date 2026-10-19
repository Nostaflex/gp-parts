import type { Metadata } from 'next';

/**
 * Layout admin — Phase 4.5
 *
 * La protection des routes /admin/* est assurée côté serveur par le middleware
 * (vérification du cookie __session). Ce layout est un simple pass-through.
 *
 * Phase 5 : ajouter une vérification JWT complète (jose + clés publiques Firebase)
 * dans le middleware pour une protection cryptographique en Edge.
 *
 * SEO lot 1 (2026-10-11) : le back-office n'est jamais indexé — meta robots ici,
 * en-tête X-Robots-Tag dans next.config.js (P1.1 de l'audit du 19/08).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
