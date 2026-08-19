/**
 * Phase 0 — Setup TTL policies Firestore (purge automatique native).
 *
 * Collections avec expiresAt (audit 2026-08-18 + sync 2026-08-19) :
 *   - audit_log.expiresAt       → purge 12 mois
 *   - demandes.expiresAt        → purge 24 mois après dernier contact
 *   - reservations.expiresAt    → purge après conservation légale
 *   - lavageDispos.expiresAt → purge après la date bloquée
 *   - stripe_events.expiresAt   → purge du ledger idempotence Stripe
 *   (leboncoin_drafts n'écrit plus expiresAt — retiré de la liste.)
 *
 * Le champ `expiresAt` doit contenir un Timestamp Firestore. Quand il est
 * dépassé, Firestore supprime le document automatiquement (zéro Cloud Function).
 * Cette opération est idempotente : appliquer une TTL déjà active = no-op.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance971 \
 *   npx tsx scripts/setup-ttl-policies.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { v1 } from '@google-cloud/firestore';

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('ERROR: Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path');
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('ERROR: Set NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf-8'));

const adminClient = new v1.FirestoreAdminClient({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  projectId,
});

// Collections où expiresAt doit déclencher la purge native (audit 2026-08-18).
const TTL_COLLECTIONS = [
  'audit_log',
  'demandes',
  'reservations',
  'lavageDispos',
  'stripe_events',
] as const;
const TTL_FIELD = 'expiresAt';

function fieldPath(collectionGroup: string): string {
  return `projects/${projectId}/databases/(default)/collectionGroups/${collectionGroup}/fields/${TTL_FIELD}`;
}

async function enableTtl(collectionGroup: string): Promise<void> {
  const name = fieldPath(collectionGroup);

  const [existing] = await adminClient.getField({ name });
  if (existing.ttlConfig?.state) {
    console.log(`✓ ${collectionGroup}.${TTL_FIELD} — TTL déjà ${existing.ttlConfig.state} (skip)`);
    return;
  }

  console.log(`→ ${collectionGroup}.${TTL_FIELD} — activation TTL...`);
  const [operation] = await adminClient.updateField({
    field: {
      name,
      ttlConfig: {},
    },
  });
  await operation.promise();
  console.log(`✓ ${collectionGroup}.${TTL_FIELD} — TTL activée`);
}

async function main(): Promise<void> {
  console.log(`Setup TTL policies sur projet ${projectId} (database (default))`);
  for (const collection of TTL_COLLECTIONS) {
    await enableTtl(collection);
  }
  console.log('✓ Done — toutes les TTL policies sont actives');
}

main().catch((err) => {
  console.error('setup-ttl-policies failed:', err);
  process.exit(1);
});
