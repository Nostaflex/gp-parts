/**
 * Définit un mot de passe pour un compte Auth STAGING (jamais prod — garde-fou
 * project_id). Le mot de passe est généré aléatoirement et affiché UNE fois.
 *
 * Usage :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account-staging.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance-staging \
 *   npx tsx scripts/set-staging-password.ts [email]
 */
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!saPath || !projectId?.includes('staging')) {
  console.error('ERROR: réservé au staging (GOOGLE_APPLICATION_CREDENTIALS + projet *staging*)');
  process.exit(1);
}

const email = process.argv[2] ?? 'djemil.david@gmail.com';
const sa = JSON.parse(readFileSync(resolve(saPath), 'utf-8'));
const app = initializeApp({ credential: cert(sa), projectId });

async function main() {
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(email);
  const password = randomBytes(12).toString('base64url');
  await auth.updateUser(user.uid, { password, emailVerified: true });
  console.log(`✓ ${email} (staging) — nouveau mot de passe : ${password}`);
}

main().then(() => process.exit(0));
