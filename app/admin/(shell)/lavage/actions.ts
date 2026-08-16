'use server';

import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { CRENEAUX_LAVAGE, DISPO_HORIZON_JOURS, isDateKey } from '@/lib/lavage-creneaux';
import { setBlocage } from '@/lib/server/lavage-dispos';
import { LavageSettingsSchema } from '@/lib/schemas/lavage';
import { localDateISO } from '@/lib/utils';

import type { LavageBlocage } from '@/lib/lavage-creneaux';
import type { FormActionState } from '@/components/admin/FormShell';
import type { Demande } from '@/lib/types';

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

export type BlocageResult = { ok: true; bloques: LavageBlocage[] } | { ok: false; error: string };

/** Garde commune : date exploitable et dans l'horizon de gestion.
 * Tolérance ±1 jour sur la borne basse (serveur UTC vs Guadeloupe UTC−4). */
function valideDateCreneau(date: string, creneau: string): string | null {
  if (!isDateKey(date)) return 'Date invalide.';
  if (date < localDateISO(-1)) return 'Date passée — créneau non modifiable.';
  if (date > localDateISO(DISPO_HORIZON_JOURS))
    return `Date trop lointaine (max ${DISPO_HORIZON_JOURS} jours).`;
  if (!(CRENEAUX_LAVAGE as readonly string[]).includes(creneau)) return 'Créneau inconnu.';
  return null;
}

/** Bloque ou libère un créneau depuis la grille de disponibilités du BO. */
export async function toggleLavageBlocage(
  date: string,
  creneau: string,
  bloquer: boolean
): Promise<BlocageResult> {
  const session = await requireAdmin();
  const invalide = valideDateCreneau(date, creneau);
  if (invalide) return { ok: false, error: invalide };

  const bloques = await setBlocage({
    date,
    creneau,
    bloquer,
    source: 'manuel',
    actor: session.email,
  });
  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'lavage-dispos',
    resourceId: `${date}_${creneau}`,
  });
  return { ok: true, bloques };
}

/** Réserve (ou libère) le créneau porté par une demande lavage — bouton
 * 1-tap dans le BO Demandes. Source 'rdv' + id de la demande tracés. */
export async function reserveCreneauDemande(
  demandeId: string,
  bloquer: boolean
): Promise<BlocageResult> {
  const session = await requireAdmin();
  const snap = await getAdminFirestore().collection('demandes').doc(demandeId).get();
  if (!snap.exists) return { ok: false, error: 'Demande introuvable.' };
  const d = snap.data() as Demande;
  if (!d.rdvDate || !d.rdvCreneau)
    return { ok: false, error: 'Cette demande ne porte pas de créneau structuré.' };
  const invalide = valideDateCreneau(d.rdvDate, d.rdvCreneau);
  if (invalide) return { ok: false, error: invalide };

  const bloques = await setBlocage({
    date: d.rdvDate,
    creneau: d.rdvCreneau,
    bloquer,
    source: 'rdv',
    demandeId,
    actor: session.email,
  });
  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'lavage-dispos',
    resourceId: `${d.rdvDate}_${d.rdvCreneau}`,
  });
  return { ok: true, bloques };
}
