/**
 * Layout admin — Phase 4.5
 *
 * La protection des routes /admin/* est assurée côté serveur par le middleware
 * (vérification du cookie __session). Ce layout est un simple pass-through.
 *
 * Phase 5 : ajouter une vérification JWT complète (jose + clés publiques Firebase)
 * dans le middleware pour une protection cryptographique en Edge.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
