'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdapter } from '@/lib/data';
import type { ReservationStatus } from '@/lib/reservations';

import type { FormActionState } from '@/components/admin/FormShell';

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee'],
  terminee: [],
  annulee: [],
};

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<FormActionState> {
  const session = await requireAdmin();

  const adapter = await getAdapter();
  const current = await adapter.getReservationById(id);
  if (!current) {
    return { errors: { _form: ['Réservation introuvable.'] } };
  }
  if (!TRANSITIONS[current.status].includes(status)) {
    return { errors: { _form: [`Transition ${current.status} → ${status} non autorisée.`] } };
  }

  await adapter.updateReservationStatus(id, status);

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'reservation',
    resourceId: id,
  });

  revalidatePath('/admin/reservations');
  return { ok: true, message: 'Statut mis à jour.' };
}
