// Lectures / écritures `avis` côté serveur via l'Admin SDK.
// Rules : create/update/delete `if false` côté client — tout passe ici.
// PII (email déposant, jamais affiché) → requireAdmin en amont des lectures BO.
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeAvisList } from '@/lib/avis';
import type { Avis, AvisStatus } from '@/lib/avis';

export async function createAvisIntake(
  data: Omit<Avis, 'id'> & { email: string }
): Promise<string> {
  const ref = await getAdminFirestore().collection('avis').add(data);
  return ref.id;
}

export async function getAvisAdmin(opts?: { limit?: number }): Promise<Avis[]> {
  const snap = await getAdminFirestore()
    .collection('avis')
    .orderBy('createdAt', 'desc')
    .limit(opts?.limit ?? 100)
    .get();
  return normalizeAvisList(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
}

export type ModerationResult = { ok: true } | { ok: false; error: string };

/**
 * Modération transactionnelle avec lock optimiste : publier / rejeter /
 * répondre. L'admin ne touche JAMAIS au texte de l'avis (L121-4).
 */
export async function moderateAvisAdmin(
  id: string,
  expectedUpdatedAt: string,
  patch: { status?: AvisStatus; reponsePro?: string }
): Promise<ModerationResult> {
  const db = getAdminFirestore();
  const ref = db.collection('avis').doc(id);
  return db.runTransaction(async (tx): Promise<ModerationResult> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: 'Avis introuvable.' };
    const current = snap.data()?.updatedAt;
    if (current && current !== expectedUpdatedAt) {
      return { ok: false, error: 'Cet avis a été modifié entre-temps. Rechargez la page.' };
    }
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { ...patch, updatedAt: now };
    if (patch.status === 'publie') update.publishedAt = now;
    if (patch.status === 'rejete') update.publishedAt = null;
    tx.update(ref, update);
    return { ok: true };
  });
}
