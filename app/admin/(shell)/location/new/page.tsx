import { LocationCarForm } from '@/components/admin/LocationCarForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouvelle voiture — Admin GP Parts',
};

export default function NewLocationCarPage() {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouvelle voiture</h1>
      <LocationCarForm />
    </div>
  );
}
