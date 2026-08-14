import { LocationCarForm } from '@/components/admin/LocationCarForm';
import { requireAdminPage } from '@/lib/admin/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouvelle voiture — Admin GP Parts',
};

export default async function NewLocationCarPage() {
  await requireAdminPage();
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouvelle voiture</h1>
      <LocationCarForm />
    </div>
  );
}
