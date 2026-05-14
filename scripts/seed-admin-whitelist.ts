/**
 * Phase 0 — Setup whitelist admin Firestore (meta/admins doc).
 *
 * Cette whitelist remplace le pattern Firebase custom claims.
 * Avantage: ajouter/retirer admin = 1 update Firestore (pas besoin Cloud Function).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance971 \
 *   ADMIN_EMAILS="djemil.david@gmail.com,stephane@carperformance.gp" \
 *   npx tsx scripts/seed-admin-whitelist.ts
 *
 * Default si ADMIN_EMAILS pas défini: djemil.david@gmail.com
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

const adminEmails = (process.env.ADMIN_EMAILS ?? 'djemil.david@gmail.com')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

if (adminEmails.length === 0) {
  console.error('ERROR: no admin emails provided');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf-8'));
initializeApp({ credential: cert(serviceAccount), projectId });

const db = getFirestore();

async function seed() {
  const ref = db.doc('meta/admins');
  const snap = await ref.get();

  const data = {
    emails: adminEmails,
    updatedAt: Date.now(),
    updatedBy: 'seed-script',
  };

  if (snap.exists) {
    console.log(`Existing meta/admins doc: ${JSON.stringify(snap.data())}`);
    console.log(`Overwriting with: ${JSON.stringify(data)}`);
  } else {
    console.log(`Creating meta/admins doc: ${JSON.stringify(data)}`);
  }

  await ref.set(data);
  console.log('✓ Done');
}

seed().catch((err) => {
  console.error('seed-admin-whitelist failed:', err);
  process.exit(1);
});
