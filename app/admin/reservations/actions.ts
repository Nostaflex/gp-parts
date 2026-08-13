'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { transitionReservationStatusAdmin } from '@/lib/admin/reservations-server';
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

  // Lecture + garde + écriture dans UNE transaction (anti-TOCTOU) : la garde
  // est réévaluée sur l'état réellement courant au moment de l'écriture.
  const result = await transitionReservationStatusAdmin(id, status, TRANSITIONS);
  if (!result.ok) {
    if (result.reason === 'introuvable') {
      return { errors: { _form: ['Réservation introuvable.'] } };
    }
    return { errors: { _form: [`Transition ${result.current} → ${status} non autorisée.`] } };
  }

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'reservation',
    resourceId: id,
  });

  revalidatePath('/admin/reservations');
  return { ok: true, message: 'Statut mis à jour.' };
}
