import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin, AdminError } from '@/lib/admin/auth';
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
  // Garde d'auth du groupe entier : le middleware Edge ne vérifie que la
  // PRÉSENCE du cookie __session — la vérification cryptographique +
  // whitelist doit vivre côté Node. Mémoïsé (React.cache) : les pages qui
  // appellent aussi requireAdmin() ne paient rien de plus.
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError) redirect('/admin/login');
    throw e;
  }
  const badges = await getNavBadges();
  return (
    <AdminShell modal={modal} badges={badges}>
      {children}
    </AdminShell>
  );
}
