'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { FeatureFlags } from '@/lib/feature-flags';
import type { FormActionState } from '@/components/admin/FormShell';

export async function toggleFeatureFlags(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const checked = (k: string) => {
    const v = formData.get(k);
    return v != null && v !== '';
  };

  const flags: FeatureFlags = {
    pieces: checked('pieces'),
    location: checked('location'),
    venteMoto: checked('venteMoto'),
    reparation: checked('reparation'),
  };

  const db = getAdminFirestore();
  await db
    .doc('meta/featureFlags')
    .set({ ...flags, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'feature-flags',
    resourceId: 'featureFlags',
  });

  revalidateTag('feature-flags');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Visibilité des sections mise à jour.' };
}
