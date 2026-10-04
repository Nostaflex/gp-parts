import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/auth';

import { LocationCarForm } from '@/components/admin/LocationCarForm';
import { TrashBanner } from '@/components/admin/Trash';
import { restoreLocationCar } from '@/app/admin/location/actions';
import { getLocationCarByIdAdmin } from '@/lib/admin/catalogue-server';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer voiture — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditLocationCarPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const car = await getLocationCarByIdAdmin(id);
  if (!car) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {car.marque} {car.modele}
      </h1>
      {car.deletedAt && (
        <TrashBanner id={car.id} updatedAt={car.updatedAt} restoreAction={restoreLocationCar} />
      )}
      <LocationCarForm initial={car} />
    </div>
  );
}
