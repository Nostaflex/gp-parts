import { MotoForm } from '@/components/admin/MotoForm';
import { requireAdminPage } from '@/lib/admin/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouvelle moto — Admin GP Parts',
};

export default async function NewMotoPage() {
  await requireAdminPage();
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouvelle moto</h1>
      <MotoForm />
    </div>
  );
}
