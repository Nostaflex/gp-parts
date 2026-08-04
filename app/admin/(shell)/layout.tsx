import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';
import { getNavBadges } from '@/lib/admin/nav-badges';

/**
 * Layout du route group (shell) : toutes les pages admin protégées sont
 * rendues dans la coquille (sidebar + topbar). `/admin/login` est hors de
 * ce group → pas de shell.
 *
 * Slot Parallel Route `@modal` câblé (Phase 2 infra) : inerte tant qu'aucune
 * route ne l'intercepte. Phase 6 ajoutera `@modal/(.)demandes/[id]` pour le
 * drawer Demandes URL-synced.
 */
export default async function ShellLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  const badges = await getNavBadges();
  return (
    <AdminShell modal={modal} badges={badges}>
      {children}
    </AdminShell>
  );
}
