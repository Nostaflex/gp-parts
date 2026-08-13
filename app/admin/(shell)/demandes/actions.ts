'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { DemandeStatus } from '@/lib/types';

export type DemandeActionResult = { ok: true } | { ok: false; error: string };

const CONFLICT_MSG = 'Cette demande a été modifiée entre-temps. Rechargez la page.';

/**
 * Écriture verrouillée (lock optimiste sur `updatedAt`) : deux admins sur la
 * même demande ne s'écrasent jamais silencieusement — le second reçoit un
 * conflit explicite au lieu d'un last-write-wins muet.
 */
async function lockedUpdate(
  id: string,
  expectedUpdatedAt: string,
  data: Record<string, string>
): Promise<DemandeActionResult> {
  const db = getAdminFirestore();
  const ref = db.collection('demandes').doc(id);
  return db.runTransaction(async (tx): Promise<DemandeActionResult> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: 'Demande introuvable.' };
    const current = snap.data()?.updatedAt;
    if (current && current !== expectedUpdatedAt) {
      return { ok: false, error: CONFLICT_MSG };
    }
    tx.update(ref, { ...data, updatedAt: new Date().toISOString() });
    return { ok: true };
  });
}

export async function updateDemandeStatus(
  id: string,
  status: DemandeStatus,
  expectedUpdatedAt: string
): Promise<DemandeActionResult> {
  const session = await requireAdmin();
  const result = await lockedUpdate(id, expectedUpdatedAt, { status });
  if (result.ok) {
    await writeAuditLog({
      actor: session.email,
      action: status === 'deleted' ? 'delete' : 'update',
      resourceType: 'demande',
      resourceId: id,
    });
  }
  revalidatePath('/admin/demandes');
  return result;
}

export async function saveDemandeNote(
  id: string,
  note: string,
  expectedUpdatedAt: string
): Promise<DemandeActionResult> {
  const session = await requireAdmin();
  const result = await lockedUpdate(id, expectedUpdatedAt, { notes: note });
  if (result.ok) {
    await writeAuditLog({
      actor: session.email,
      action: 'update',
      resourceType: 'demande',
      resourceId: id,
    });
  }
  revalidatePath('/admin/demandes');
  return result;
}
