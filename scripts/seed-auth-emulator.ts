/**
 * Crée l'utilisateur admin de test dans l'émulateur Firebase Auth.
 *
 * Usage (FIREBASE_AUTH_EMULATOR_HOST requis) :
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *   TEST_ADMIN_EMAIL=admin-test@gp-parts.local \
 *   TEST_ADMIN_PASSWORD=test-password-e2e \
 *   npx tsx scripts/seed-auth-emulator.ts
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('ERROR: FIREBASE_AUTH_EMULATOR_HOST doit être défini (ex: 127.0.0.1:9099)');
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-gp-parts';
const email = process.env.TEST_ADMIN_EMAIL ?? 'admin-test@gp-parts.local';
const password = process.env.TEST_ADMIN_PASSWORD ?? 'test-password-e2e';

// En mode émulateur, initializeApp sans credentials suffit
initializeApp({ projectId });

async function seed() {
  const auth = getAuth();

  try {
    const user = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });
    console.log(`✓ Utilisateur test créé : ${user.email} (${user.uid})`);
  } catch (err: unknown) {
    // L'utilisateur existe déjà — pas un problème
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 'auth/email-already-exists'
    ) {
      console.log(`✓ Utilisateur test déjà présent : ${email}`);
    } else {
      throw err;
    }
  }
}

seed().catch((err) => {
  console.error('seed-auth-emulator failed:', err);
  process.exit(1);
});
