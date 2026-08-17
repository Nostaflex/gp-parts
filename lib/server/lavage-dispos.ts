// Disponibilités esthétique (collection lavageDispos, doc id = YYYY-MM-DD).
// Admin SDK uniquement — les règles Firestore laissent la collection fermée ;
// tout accès public passe par l'API route, tout accès BO par les Server
// Actions (requireAdmin en amont).
import { FieldPath } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { CRENEAUX_LAVAGE, normalizeBlocages } from '@/lib/lavage-creneaux';
import { normalizeSemaineType, prisParSemaineType } from '@/lib/lavage-semaine';
import type { LavageBlocage, PrisParDate } from '@/lib/lavage-creneaux';
import type { SemaineType } from '@/lib/lavage-semaine';

const COLLECTION = 'lavageDispos';
const SEMAINE_DOC = 'meta/lavageSemaineType';

/** Semaine type courante (défauts si doc absent). */
export async function getSemaineType(): Promise<SemaineType> {
  const snap = await getAdminFirestore().doc(SEMAINE_DOC).get();
  return normalizeSemaineType(snap.exists ? snap.data() : null);
}

/** Indisponibilités EFFECTIVES par date : semaine type (jour fermé, créneau
 * inactif) ∪ exceptions (blocages/réservations). C'est LA vérité que lisent
 * la page publique, l'API et la re-vérification au submit. */
export async function getPrisEffectifs(dates: string[]): Promise<PrisParDate> {
  if (dates.length === 0) return {};
  const [semaine, blocages] = await Promise.all([
    getSemaineType(),
    getBlocagesRange(dates[0], dates[dates.length - 1]),
  ]);
  const out: PrisParDate = {};
  for (const date of dates) {
    const parSemaine = prisParSemaineType(date, semaine);
    const parBlocage = (blocages[date] ?? []).map((b) => b.creneau);
    const union = [...new Set([...parSemaine, ...parBlocage])];
    if (union.length > 0) out[date] = union;
  }
  return out;
}

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

/** Bloque ou libère une JOURNÉE entière (geste rapide BO / congés).
 * Bloquer préserve les entrées 'rdv' existantes (trace demandeId) ; libérer
 * ne retire que les blocages manuels — jamais une réservation. */
export async function setJournee(opts: {
  date: string;
  bloquer: boolean;
  actor: string;
}): Promise<LavageBlocage[]> {
  const ref = getAdminFirestore().collection(COLLECTION).doc(opts.date);
  const snap = await ref.get();
  const current = normalizeBlocages(snap.exists ? snap.data() : null);
  const rdv = current.filter((b) => b.source === 'rdv');
  const bloques: LavageBlocage[] = opts.bloquer
    ? CRENEAUX_LAVAGE.map(
        (creneau) =>
          rdv.find((b) => b.creneau === creneau) ?? { creneau, source: 'manuel' as const }
      )
    : rdv;
  await ref.set({
    bloques,
    updatedAt: Date.now(),
    updatedBy: opts.actor,
    expiresAt: new Date(`${opts.date}T00:00:00Z`).getTime() + 90 * 24 * 3600 * 1000,
  });
  return bloques;
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
