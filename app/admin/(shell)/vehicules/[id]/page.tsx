import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/auth';

import { VehiculeForm } from '@/components/admin/VehiculeForm';
import { getAdapter } from '@/lib/data';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer véhicule — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditVehiculePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const adapter = await getAdapter();
  // Charge tous les véhicules puis filtre par id : l'interface DataAdapter
  // n'expose pas getVehiculeById. Acceptable au volume actuel (catalogue
  // physique, ~7 véhicules). TODO: ajouter getVehiculeById à DataAdapter
  // si le catalogue dépasse ~50 véhicules.
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
