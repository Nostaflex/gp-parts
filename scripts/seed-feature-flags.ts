/**
 * Pose l'état de visibilité des sections dans Firestore (meta/featureFlags).
 *
 * Usage (état de lancement « Vente véhicule seule ») :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance971 \
 *   FLAGS_PIECES=false FLAGS_LOCATION=false FLAGS_VENTE_MOTO=false FLAGS_REPARATION=false \
 *   npx tsx scripts/seed-feature-flags.ts
 *
 * Défaut si une variable FLAGS_* est absente : true (section visible).
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

const bool = (v: string | undefined, def: boolean) =>
  v == null ? def : v.toLowerCase() === 'true';

const flags = {
  pieces: bool(process.env.FLAGS_PIECES, true),
  location: bool(process.env.FLAGS_LOCATION, true),
  venteVehicule: bool(process.env.FLAGS_VENTE_VEHICULE, true),
  venteMoto: bool(process.env.FLAGS_VENTE_MOTO, true),
  reparation: bool(process.env.FLAGS_REPARATION, true),
  lavage: bool(process.env.FLAGS_LAVAGE, true),
  updatedAt: Date.now(),
  updatedBy: 'seed-script',
};

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf-8'));
initializeApp({ credential: cert(serviceAccount), projectId });

getFirestore()
  .doc('meta/featureFlags')
  .set(flags, { merge: true })
  .then(() => {
    console.log('✓ meta/featureFlags =', JSON.stringify(flags));
    process.exit(0);
  })
  .catch((err) => {
    console.error('seed-feature-flags failed:', err);
    process.exit(1);
  });
