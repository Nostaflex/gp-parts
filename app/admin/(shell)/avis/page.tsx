import { requireAdminPage } from '@/lib/admin/auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeAvisList } from '@/lib/avis';
import { AvisModClient } from './AvisModClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Avis clients — Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminAvisPage() {
  await requireAdminPage();
  // Lecture directe Admin SDK (email du déposant inclus — jamais côté public).
  const snap = await getAdminFirestore()
    .collection('avis')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  const emailById = new Map(snap.docs.map((d) => [d.id, String(d.data().email ?? '')]));
  const avis = normalizeAvisList(snap.docs.map((d) => ({ ...d.data(), id: d.id }))).map((a) => ({
    ...a,
    email: emailById.get(a.id) || undefined,
  }));

  return (
    <section className="flex flex-col gap-4 p-4 max-w-3xl">
      <div>
        <h1 className="text-title" style={{ color: 'var(--text)' }}>
          Avis clients
        </h1>
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Chaque avis déposé sur le site attend ta décision : publier, rejeter, ou répondre. Le
          texte d&apos;un avis ne peut jamais être modifié (obligation légale — pratique commerciale
          trompeuse sinon). Rien n&apos;est publié sans ton accord.
        </p>
      </div>
      <AvisModClient avis={avis} />
    </section>
  );
}
