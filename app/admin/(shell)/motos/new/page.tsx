import { MotoForm } from '@/components/admin/MotoForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouvelle moto — Admin GP Parts',
};

export default function NewMotoPage() {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouvelle moto</h1>
      <MotoForm />
    </div>
  );
}
