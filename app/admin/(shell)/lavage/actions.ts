'use server';

import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { LavageSettingsSchema } from '@/lib/schemas/lavage';

import type { FormActionState } from '@/components/admin/FormShell';

/**
 * Enregistre les formules lavage (doc meta/lavageSettings).
 * Le client sérialise la liste en JSON (champ `formulesJson`) — liste
 * dynamique, impossible à mapper proprement en champs FormData plats.
 */
export async function updateLavageSettings(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  let candidate: unknown;
  try {
    candidate = JSON.parse(String(formData.get('formulesJson') ?? ''));
  } catch {
    return { errors: { _form: ['Saisie illisible — recharge la page et réessaie.'] } };
  }

  const parsed = LavageSettingsSchema.safeParse({ formules: candidate });
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message);
    return { errors: { _form: [...new Set(messages)] } };
  }

  await getAdminFirestore()
    .doc('meta/lavageSettings')
    .set({ ...parsed.data, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'lavage-settings',
    resourceId: 'lavageSettings',
  });

  revalidateTag('lavage-settings');
  return {
    ok: true,
    message: 'Formules lavage enregistrées — visibles immédiatement sur le site.',
  };
}
