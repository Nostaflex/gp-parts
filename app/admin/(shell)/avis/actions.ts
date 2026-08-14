'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { moderateAvisAdmin } from '@/lib/server/avis';
import { AvisReponseSchema } from '@/lib/schemas/avis';
import type { ModerationResult } from '@/lib/server/avis';

// CADRE LÉGAL (L121-4 C. conso) : la modération = publier / rejeter /
// répondre. AUCUNE action ici ne modifie le texte d'un avis client — ne
// jamais en ajouter une.

async function moderate(
  id: string,
  expectedUpdatedAt: string,
  patch: { status?: 'publie' | 'rejete'; reponsePro?: string },
  auditAction: 'update' | 'delete'
): Promise<ModerationResult> {
  const session = await requireAdmin();
  const result = await moderateAvisAdmin(id, expectedUpdatedAt, patch);
  if (result.ok) {
    await writeAuditLog({
      actor: session.email,
      action: auditAction,
      resourceType: 'avis',
      resourceId: id,
    });
    revalidateTag('avis');
  }
  revalidatePath('/admin/avis');
  return result;
}

export async function publishAvis(id: string, expectedUpdatedAt: string) {
  return moderate(id, expectedUpdatedAt, { status: 'publie' }, 'update');
}

export async function rejectAvis(id: string, expectedUpdatedAt: string) {
  return moderate(id, expectedUpdatedAt, { status: 'rejete' }, 'update');
}

export async function saveAvisReponse(
  id: string,
  reponse: string,
  expectedUpdatedAt: string
): Promise<ModerationResult> {
  const parsed = AvisReponseSchema.safeParse(reponse);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Réponse invalide.' };
  }
  return moderate(id, expectedUpdatedAt, { reponsePro: parsed.data }, 'update');
}
