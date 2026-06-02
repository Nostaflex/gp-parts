import { notFound } from 'next/navigation';

import { LocationCarForm } from '@/components/admin/LocationCarForm';
import { getAdapter } from '@/lib/data';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer voiture — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditLocationCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adapter = await getAdapter();
  const car = await adapter.getLocationCarById(id);
  if (!car) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {car.marque} {car.modele}
      </h1>
      <LocationCarForm initial={car} />
    </div>
  );
}
