import { getAdminFirestore } from '@/lib/firebase-admin';
import { ttlMillis } from '@/lib/ttl';
import type { Demande, DemandeStatus, DemandeType } from '@/lib/types';

/**
 * Lecture admin des demandes (Admin SDK, contourne les rules). TOUJOURS
 * appeler requireAdmin() en amont (PII : nom/email/téléphone).
 */
export async function getDemandesAdmin(opts?: {
  type?: DemandeType;
  status?: DemandeStatus;
  limit?: number;
}): Promise<Demande[]> {
  let q = getAdminFirestore().collection('demandes').orderBy('createdAt', 'desc');
  if (opts?.type) q = q.where('type', '==', opts.type) as typeof q;
  if (opts?.status) q = q.where('status', '==', opts.status) as typeof q;
  if (opts?.limit) q = q.limit(opts.limit) as typeof q;
  const snap = await q.get();
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, expiresAt: ttlMillis(data.expiresAt), id: d.id } as Demande;
  });
}
