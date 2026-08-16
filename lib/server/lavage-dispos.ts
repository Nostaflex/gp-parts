// Disponibilités esthétique (collection lavageDispos, doc id = YYYY-MM-DD).
// Admin SDK uniquement — les règles Firestore laissent la collection fermée ;
// tout accès public passe par l'API route, tout accès BO par les Server
// Actions (requireAdmin en amont).
import { FieldPath } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeBlocages } from '@/lib/lavage-creneaux';
import type { LavageBlocage } from '@/lib/lavage-creneaux';

const COLLECTION = 'lavageDispos';

/** Blocages d'une date (liste vide si aucun doc). */
export async function getBlocages(date: string): Promise<LavageBlocage[]> {
  const snap = await getAdminFirestore().collection(COLLECTION).doc(date).get();
  return normalizeBlocages(snap.exists ? snap.data() : null);
}

/** Blocages sur une plage de dates (bornes incluses) → map date → blocages.
 * Une requête unique sur l'id de doc — les dates sans doc sont absentes. */
export async function getBlocagesRange(
  from: string,
  to: string
): Promise<Record<string, LavageBlocage[]>> {
  const snaps = await getAdminFirestore()
    .collection(COLLECTION)
    .where(FieldPath.documentId(), '>=', from)
    .where(FieldPath.documentId(), '<=', to)
    .get();
  const out: Record<string, LavageBlocage[]> = {};
  for (const doc of snaps.docs) out[doc.id] = normalizeBlocages(doc.data());
  return out;
}

/** Pose ou retire un blocage sur (date, créneau). Écriture pleine du doc
 * (relecture + remplacement) : la liste reste dédoublonnée et normalisée.
 * TTL : expiresAt = date + 90 j (purge par politique TTL Firestore). */
export async function setBlocage(opts: {
  date: string;
  creneau: string;
  bloquer: boolean;
  source: LavageBlocage['source'];
  demandeId?: string;
  actor: string;
}): Promise<LavageBlocage[]> {
  const ref = getAdminFirestore().collection(COLLECTION).doc(opts.date);
  const snap = await ref.get();
  const current = normalizeBlocages(snap.exists ? snap.data() : null);
  const sans = current.filter((b) => b.creneau !== opts.creneau);
  const bloques = opts.bloquer
    ? [
        ...sans,
        {
          creneau: opts.creneau,
          source: opts.source,
          ...(opts.demandeId ? { demandeId: opts.demandeId } : {}),
        },
      ]
    : sans;
  await ref.set({
    bloques,
    updatedAt: Date.now(),
    updatedBy: opts.actor,
    expiresAt: new Date(`${opts.date}T00:00:00Z`).getTime() + 90 * 24 * 3600 * 1000,
  });
  return bloques;
}
