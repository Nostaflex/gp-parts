import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/auth';

import { MotoForm } from '@/components/admin/MotoForm';
import { getAdapter } from '@/lib/data';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer moto — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditMotoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const adapter = await getAdapter();
  // Charge toutes les motos puis filtre par id : l'interface DataAdapter
  // n'expose pas getMotoById. Acceptable au volume actuel (catalogue
  // physique, ~7 motos). TODO: ajouter getMotoById à DataAdapter
  // si le catalogue dépasse ~50 motos.
  const motos = await adapter.getMotos();
  const moto = motos.find((m) => m.id === id);
  if (!moto) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {moto.marque} {moto.modele}
      </h1>
      <MotoForm initial={moto} />
    </div>
  );
}
