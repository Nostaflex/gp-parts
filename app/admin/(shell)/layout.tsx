import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';

/**
 * Layout du route group (shell) : toutes les pages admin protégées sont
 * rendues dans la coquille (sidebar + topbar). `/admin/login` est hors de
 * ce group → pas de shell.
 *
 * Phase 6 : ajouter le slot Parallel Route `@modal` (drawer Demandes) en
 * paramètre de ce layout + `<AdminShell modal={modal}>`.
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
