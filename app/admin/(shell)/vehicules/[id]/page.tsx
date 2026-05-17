import { notFound } from 'next/navigation';

import { VehiculeForm } from '@/components/admin/VehiculeForm';
import { getAdapter } from '@/lib/data';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer véhicule — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditVehiculePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adapter = await getAdapter();
  const vehicules = await adapter.getVehicules();
  const vehicule = vehicules.find((v) => v.id === id);
  if (!vehicule) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {vehicule.marque} {vehicule.modele}
      </h1>
      <VehiculeForm initial={vehicule} />
    </div>
  );
}
