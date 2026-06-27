'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { DemandeStatus } from '@/lib/types';

export async function updateDemandeStatus(id: string, status: DemandeStatus): Promise<void> {
  const session = await requireAdmin();
  await getAdminFirestore()
    .collection('demandes')
    .doc(id)
    .update({ status, updatedAt: new Date().toISOString() });
  await writeAuditLog({
    actor: session.email,
    action: status === 'deleted' ? 'delete' : 'update',
    resourceType: 'demande',
    resourceId: id,
  });
  revalidatePath('/admin/demandes');
}

export async function saveDemandeNote(id: string, note: string): Promise<void> {
  const session = await requireAdmin();
  await getAdminFirestore()
    .collection('demandes')
    .doc(id)
    .update({ notes: note, updatedAt: new Date().toISOString() });
  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'demande',
    resourceId: id,
  });
  revalidatePath('/admin/demandes');
}
