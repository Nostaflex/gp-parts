/**
 * Active les policies TTL Firestore sur `expiresAt` (équivalent de
 * `gcloud firestore fields ttls update … --enable-ttl`, sans gcloud :
 * API REST Firestore Admin + token du service account).
 *
 * À lancer APRÈS le backfill Timestamp (scripts/backfill-ttl-timestamps.ts) —
 * une policy sur un champ number ne purgerait rien.
 *
 * Usage :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance971 \
 *   npx tsx scripts/enable-ttl-policies.ts
 */
import { GoogleAuth } from 'google-auth-library';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !projectId) {
  console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS + NEXT_PUBLIC_FIREBASE_PROJECT_ID requis');
  process.exit(1);
}

const COLLECTIONS = ['demandes', 'reservations', 'audit_log', 'lavage-blocages', 'stripe_events'];

async function main() {
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/datastore'] });
  const token = await (await auth.getClient()).getAccessToken();
  if (!token.token) throw new Error('token introuvable');

  for (const col of COLLECTIONS) {
    const name =
      `projects/${projectId}/databases/(default)` + `/collectionGroups/${col}/fields/expiresAt`;
    const url = `https://firestore.googleapis.com/v1/${name}?updateMask=ttlConfig`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ttlConfig: {} }),
    });
    const body = (await res.json()) as { name?: string; error?: { message?: string } };
    if (res.ok) {
      console.log(`✓ ${col}: policy TTL demandée (opération longue côté Google) — ${body.name}`);
    } else {
      console.error(`✗ ${col}: ${res.status} ${body.error?.message ?? ''}`);
    }
  }
  console.log(
    'Vérifier l’état : console Firebase → Firestore → TTL (les policies passent ACTIVE en quelques minutes).'
  );
}

main().then(() => process.exit(0));
