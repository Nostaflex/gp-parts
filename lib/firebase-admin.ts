/**
 * Firebase Admin SDK — initialisation unique pour les routes API Next.js (Node.js runtime).
 * NE PAS importer dans des composants client ou des fichiers qui tournent en Edge Runtime.
 *
 * Variables d'environnement :
 *   Production  → FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
 *   Emulateur   → FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 (credentials non requis)
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Storage } from 'firebase-admin/storage';

// Bucket par défaut pour getAdminStorage().bucket() — même valeur que le SDK
// client (lib/firebase.ts). NEXT_PUBLIC car le storefront en a aussi besoin.
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // En mode émulateur, pas besoin de credentials réels
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-gp-parts',
      storageBucket: STORAGE_BUCKET,
    });
  }

  // Production : credentials service account requis
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin : variables FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL et FIREBASE_ADMIN_PRIVATE_KEY manquantes.'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: STORAGE_BUCKET,
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Firestore via Admin SDK (Node.js runtime uniquement).
 *
 * Utilisé par les Server Actions admin (Phase 3+) : whitelist `meta/admins`,
 * audit log, CRUD vehicules/motos/demandes. Contourne les Security Rules
 * (privilèges service account) — toujours protéger l'accès via requireAdmin().
 */
export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Cloud Storage via Admin SDK (Node.js runtime uniquement).
 *
 * Utilisé par /api/admin/upload : écriture des photos catalogue côté serveur
 * (service account → contourne les Security Rules). L'auth est garantie EN AMONT
 * par requireAdmin() (cookie __session) — ne JAMAIS appeler sans cette garde.
 * Évite la dépendance fragile à l'auth client Firebase (currentUser null sur
 * mobile quand IndexedDB est évincé → upload SDK client `storage/unauthorized`).
 */
export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
