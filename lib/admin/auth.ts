/**
 * Garde d'authentification admin côté serveur (Admin CMS v3 — Phase 3+).
 *
 * `requireAdmin()` est appelé en première ligne de chaque Server Action /
 * Route Handler admin. Il :
 *   1. lit le session cookie `__session`
 *   2. en vérifie l'authenticité (prod : verifySessionCookie ; émulateur :
 *      le cookie est un uid brut → résolution via getUser)
 *   3. exige un email vérifié
 *   4. vérifie l'appartenance à la whitelist Firestore `meta/admins`
 *
 * Le middleware Edge ne fait qu'une vérification de présence du cookie ;
 * la vraie vérification cryptographique + whitelist est ici.
 *
 * Node.js runtime uniquement (Admin SDK). Ne pas importer côté client/Edge.
 */
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';

export class AdminError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminError';
    this.status = status;
  }
}

export interface AdminSession {
  uid: string;
  email: string;
}

export async function requireAdmin(): Promise<AdminSession> {
  const sessionCookie = (await cookies()).get('__session')?.value;
  if (!sessionCookie) {
    throw new AdminError('Non authentifié', 401);
  }

  let uid: string;
  let email: string | undefined;
  let emailVerified: boolean;

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    // Émulateur : le cookie __session est l'uid brut (cf. sessionLogin /
    // emulator-login). Pas de session cookie signé à vérifier.
    try {
      const user = await getAdminAuth().getUser(sessionCookie);
      uid = user.uid;
      email = user.email;
      emailVerified = user.emailVerified;
    } catch {
      throw new AdminError('Session invalide', 401);
    }
  } else {
    // Production : session cookie opaque signé par Google.
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
      email = decoded.email;
      emailVerified = decoded.email_verified === true;
    } catch {
      throw new AdminError('Session invalide', 401);
    }
  }

  if (!emailVerified) {
    throw new AdminError('Email non vérifié', 403);
  }

  const adminDoc = await getAdminFirestore().doc('meta/admins').get();
  const emails: string[] = adminDoc.data()?.emails ?? [];
  if (!email || !emails.includes(email)) {
    throw new AdminError('Accès admin refusé', 403);
  }

  return { uid, email };
}
