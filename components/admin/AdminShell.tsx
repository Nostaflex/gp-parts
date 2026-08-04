import type { ReactNode } from 'react';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

import type { NavBadges } from '@/lib/admin/nav-badges';

/**
 * Coquille du back-office (iOS Clarity).
 *
 * Layout : sidebar permanente (desktop) + topbar sticky + contenu.
 * `modal` = slot Parallel Route `@modal` (drawer Demandes, câblé Phase 6).
 * Inerte tant qu'aucune route ne le remplit.
 */
export function AdminShell({
  children,
  modal,
  badges,
}: {
  children: ReactNode;
  modal?: ReactNode;
  badges?: NavBadges;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <AdminSidebar badges={badges} />
      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopBar />
        {/* div (pas <main>) : le <main id="main"> unique vit dans le root layout */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      {modal}
    </div>
  );
}
