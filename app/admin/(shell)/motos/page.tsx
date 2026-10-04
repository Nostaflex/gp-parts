import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin/auth';

import { getMotosAdmin } from '@/lib/admin/catalogue-server';

import { MotosTable } from './MotosTable';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Motos — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminMotosPage() {
  await requireAdminPage();
  const motos = await getMotosAdmin();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title font-semibold text-[var(--text)]">Motos</h1>
        <Link
          href="/admin/motos/new"
          className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white inline-flex items-center"
          style={{ background: 'var(--blue)' }}
        >
          + Nouvelle moto
        </Link>
      </div>
      <MotosTable motos={motos} />
    </div>
  );
}
