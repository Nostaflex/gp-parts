import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin/auth';

import { getAdapter } from '@/lib/data';

import { VehiculesTable } from './VehiculesTable';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Véhicules — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminVehiculesPage() {
  await requireAdminPage();
  const adapter = await getAdapter();
  const vehicules = await adapter.getVehicules();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title font-semibold text-[var(--text)]">Véhicules</h1>
        <Link
          href="/admin/vehicules/new"
          className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white inline-flex items-center"
          style={{ background: 'var(--blue)' }}
        >
          + Nouveau véhicule
        </Link>
      </div>
      <VehiculesTable vehicules={vehicules} />
    </div>
  );
}
