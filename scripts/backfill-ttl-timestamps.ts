/**
 * Backfill TTL (audit 2026-08-18) : convertit les champs `expiresAt` écrits
 * en NOMBRES Unix vers des `Timestamp` Firestore natifs — sans ça, les
 * policies TTL n'expirent jamais rien et la purge RGPD promise est morte.
 *
 * Collections couvertes : demandes, reservations, audit_log, lavageDispos.
 * Idempotent : un doc déjà en Timestamp est ignoré.
 *
 * Usage (staging d'abord, prod sur ordre) :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account-staging.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance-staging \
 *   npx tsx scripts/backfill-ttl-timestamps.ts [--dry-run]
 *
 * APRÈS le backfill, activer les policies TTL (une fois par collection) :
 *   gcloud firestore fields ttls update expiresAt \
 *     --collection-group=demandes --enable-ttl --project=<PROJECT_ID>
 *   (répéter pour reservations, audit_log, lavageDispos)
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!saPath || !projectId) {
  console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS + NEXT_PUBLIC_FIREBASE_PROJECT_ID requis');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const COLLECTIONS = ['demandes', 'reservations', 'audit_log', 'lavageDispos'];

const sa = JSON.parse(readFileSync(resolve(saPath), 'utf-8'));
const app = initializeApp({ credential: cert(sa), projectId });
const db = getFirestore(app);

async function main() {
  console.log(`Backfill TTL sur ${projectId}${dryRun ? ' (DRY RUN — aucune écriture)' : ''}`);
  for (const col of COLLECTIONS) {
    const snap = await db.collection(col).get();
    let converted = 0;
    let already = 0;
    let absent = 0;
    for (const doc of snap.docs) {
      const v = doc.data().expiresAt;
      if (v === undefined || v === null) {
        absent++;
        continue;
      }
      if (typeof v === 'number' && Number.isFinite(v)) {
        if (!dryRun) await doc.ref.update({ expiresAt: Timestamp.fromMillis(v) });
        converted++;
      } else {
        already++; // déjà Timestamp (ou type inattendu — laissé tel quel)
      }
    }
    console.log(
      `  ${col}: ${snap.size} docs — ${converted} converti(s), ${already} déjà OK, ${absent} sans expiresAt`
    );
  }
  console.log('Terminé. Pensez aux policies TTL gcloud (voir l’en-tête du script).');
}

main().then(() => process.exit(0));
