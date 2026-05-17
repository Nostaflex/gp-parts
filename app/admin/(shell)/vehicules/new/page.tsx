import { VehiculeForm } from '@/components/admin/VehiculeForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouveau véhicule — Admin GP Parts',
};

export default function NewVehiculePage() {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouveau véhicule</h1>
      <VehiculeForm />
    </div>
  );
}
