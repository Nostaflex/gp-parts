import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/auth';

import { VehiculeForm } from '@/components/admin/VehiculeForm';
import { TrashBanner } from '@/components/admin/Trash';
import { restoreVehicule } from '@/app/admin/vehicules/actions';
import { getVehiculeByIdAdmin } from '@/lib/admin/catalogue-server';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer véhicule — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditVehiculePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const vehicule = await getVehiculeByIdAdmin(id);
  if (!vehicule) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {vehicule.marque} {vehicule.modele}
      </h1>
      {vehicule.deletedAt && (
        <TrashBanner
          id={vehicule.id}
          updatedAt={vehicule.updatedAt}
          restoreAction={restoreVehicule}
        />
      )}
      <VehiculeForm initial={vehicule} />
    </div>
  );
}
