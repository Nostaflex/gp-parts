/**
 * Reconstruit service-account-staging.json depuis un fichier d'env Vercel
 * (les creds admin staging vivent dans l'environnement Preview).
 *
 * Usage :
 *   npx vercel env pull .env.staging.local --environment=preview
 *   npx tsx scripts/make-staging-service-account.ts
 *
 * Garde-fou : refuse d'écrire si le project_id ne contient pas "staging"
 * (empêche d'exfiltrer les creds PROD dans un fichier au nom trompeur).
 * Le fichier produit est couvert par .gitignore (service-account*.json).
 */
import { readFileSync, writeFileSync } from 'fs';

const ENV_FILE = process.argv[2] ?? '.env.staging.local';
const OUT_FILE = 'service-account-staging.json';

const env: Record<string, string> = {};
for (const line of readFileSync(ENV_FILE, 'utf-8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0) env[line.slice(0, i)] = line.slice(i + 1).replace(/^"|"$/g, '');
}

const projectId = env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey?.includes('BEGIN PRIVATE KEY')) {
  console.error(`ERROR: champs FIREBASE_ADMIN_* absents ou invalides dans ${ENV_FILE}`);
  process.exit(1);
}
if (!projectId.includes('staging')) {
  console.error(
    `ERROR: project_id "${projectId}" ne contient pas "staging" — refus d'écrire ${OUT_FILE}`
  );
  process.exit(1);
}

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      type: 'service_account',
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    },
    null,
    2
  ),
  { mode: 0o600 }
);
console.log(`✓ ${OUT_FILE} écrit pour ${projectId} (${clientEmail})`);
