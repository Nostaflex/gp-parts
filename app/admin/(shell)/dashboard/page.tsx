import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/admin/auth';

import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Tableau de bord — Admin GP Parts',
  robots: { index: false, follow: false },
};

/**
 * Phase 4 : le fetch des produits est déplacé côté client dans AdminDashboardClient.
 * Raison : éviter que le Server Component sérialise les données en HTML SSR
 * avant que l'auth guard (app/admin/layout.tsx) ait pu vérifier l'authentification.
 *
 * Phase 5+ : implémenter une session cookie Firebase + middleware server-side
 * pour une protection SSR complète.
 */
export default async function AdminDashboardPage() {
  await requireAdminPage();
  return <AdminDashboardClient />;
}
