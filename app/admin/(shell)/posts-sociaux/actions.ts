'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeSocialSettings } from '@/lib/social-settings';
import type { FormActionState } from '@/components/admin/FormShell';

export async function updateSocialSettings(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const str = (k: string) => String(formData.get(k) ?? '').trim();
  // normalize = même garde que la lecture : valeurs invalides → défauts.
  const settings = normalizeSocialSettings({
    defaultHashtags: str('defaultHashtags'),
    signature: str('signature'),
  });

  await getAdminFirestore()
    .doc('meta/socialSettings')
    .set({ ...settings, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'social-settings',
    resourceId: 'socialSettings',
  });

  revalidatePath('/admin/posts-sociaux');
  return { ok: true, message: 'Réglages sociaux enregistrés.' };
}
