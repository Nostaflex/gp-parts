/**
 * Vérification READ-ONLY du staging : comptages par collection, whitelist
 * admin, comptes Auth. Aucune écriture.
 *
 * Usage :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account-staging.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance-staging \
 *   npx tsx scripts/check-staging.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!saPath || !projectId) {
  console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS et NEXT_PUBLIC_FIREBASE_PROJECT_ID requis');
  process.exit(1);
}
if (!projectId.includes('staging')) {
  console.error(`ERROR: ce check est réservé au staging (reçu: ${projectId})`);
  process.exit(1);
}

const sa = JSON.parse(readFileSync(resolve(saPath), 'utf-8'));
const app = initializeApp({ credential: cert(sa), projectId });
const db = getFirestore(app);

async function main() {
  console.log(`Projet: ${projectId}\n`);
  for (const col of [
    'products',
    'vehicules',
    'motos',
    'location-cars',
    'orders',
    'avis',
    'demandes',
    'reservations',
  ]) {
    const snap = await db.collection(col).count().get();
    console.log(`${col.padEnd(14)} ${snap.data().count}`);
  }
  const admins = await db.doc('meta/admins').get();
  console.log(
    `\nmeta/admins:   ${admins.exists ? JSON.stringify(admins.data()?.emails) : 'ABSENT'}`
  );
  const flags = await db.doc('meta/featureFlags').get();
  const contact = await db.doc('meta/contactInfo').get();
  console.log(`feature_flags: ${flags.exists ? 'présent' : 'ABSENT'}`);
  console.log(`contact_info:  ${contact.exists ? 'présent' : 'ABSENT'}`);
  const users = await getAuth(app).listUsers(10);
  console.log(
    `\nAuth users:    ${users.users.map((u) => `${u.email}${u.emailVerified ? '' : ' (email NON vérifié)'}`).join(', ') || 'AUCUN'}`
  );
}

main().then(() => process.exit(0));
