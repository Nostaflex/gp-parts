import { VehiculeForm } from '@/components/admin/VehiculeForm';
import { requireAdminPage } from '@/lib/admin/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouveau véhicule — Admin GP Parts',
};

export default async function NewVehiculePage() {
  await requireAdminPage();
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouveau véhicule</h1>
      <VehiculeForm />
    </div>
  );
}
