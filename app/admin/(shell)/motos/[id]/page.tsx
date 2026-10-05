import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/auth';

import { MotoForm } from '@/components/admin/MotoForm';
import { TrashBanner } from '@/components/admin/Trash';
import { restoreMoto } from '@/app/admin/motos/actions';
import { getMotoByIdAdmin } from '@/lib/admin/catalogue-server';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer moto — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditMotoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const moto = await getMotoByIdAdmin(id);
  if (!moto) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {moto.marque} {moto.modele}
      </h1>
      {moto.deletedAt && (
        <TrashBanner id={moto.id} updatedAt={moto.updatedAt} restoreAction={restoreMoto} />
      )}
      <MotoForm initial={moto} />
    </div>
  );
}
