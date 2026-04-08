import { AdminDashboardClient } from './AdminDashboardClient';

/**
 * Phase 4 : le fetch des produits est déplacé côté client dans AdminDashboardClient.
 * Raison : éviter que le Server Component sérialise les données en HTML SSR
 * avant que l'auth guard (app/admin/layout.tsx) ait pu vérifier l'authentification.
 *
 * Phase 5+ : implémenter une session cookie Firebase + middleware server-side
 * pour une protection SSR complète.
 */
export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
