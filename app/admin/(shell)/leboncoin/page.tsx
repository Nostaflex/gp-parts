import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/admin/auth';

import { getAdapter } from '@/lib/data';

import { LeboncoinExportClient } from './LeboncoinExportClient';

export const metadata: Metadata = {
  title: 'Export Leboncoin — Admin',
  robots: { index: false, follow: false },
};

// Inventaire réel (Firestore) — jamais le seed statique figé. force-dynamic +
// getAdapter() : même chemin que /admin/vehicules et /admin/motos.
export const dynamic = 'force-dynamic';

export default async function LeboncoinPage() {
  await requireAdminPage();
  const adapter = await getAdapter();
  const [vehicules, motos] = await Promise.all([adapter.getVehicules(), adapter.getMotos()]);

  return <LeboncoinExportClient vehicules={vehicules} motos={motos} />;
}
