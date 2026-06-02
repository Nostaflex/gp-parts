import Link from 'next/link';

import { getAdapter } from '@/lib/data';

import { LocationCarsTable } from './LocationCarsTable';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Location — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminLocationPage() {
  const adapter = await getAdapter();
  const cars = await adapter.getLocationCars();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title font-semibold text-[var(--text)]">Location</h1>
        <Link
          href="/admin/location/new"
          className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white inline-flex items-center"
          style={{ background: 'var(--blue)' }}
        >
          + Nouvelle voiture
        </Link>
      </div>
      <LocationCarsTable cars={cars} />
    </div>
  );
}
