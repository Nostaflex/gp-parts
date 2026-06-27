import { requireAdmin } from '@/lib/admin/auth';
import { getDemandesAdmin } from '@/lib/admin/demandes-server';
import { DemandesClient } from '@/components/admin/DemandesClient';

export const dynamic = 'force-dynamic';

export default async function DemandesPage() {
  await requireAdmin();
  const demandes = await getDemandesAdmin({ limit: 100 });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-title text-h2" style={{ color: 'var(--text)' }}>
          Demandes
        </h1>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Messages de contact et demandes de RDV reçus via le site.
        </p>
      </div>
      <DemandesClient demandes={demandes} />
    </section>
  );
}
