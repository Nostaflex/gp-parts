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
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

/**
 * Mémoïsé par requête via React.cache : le layout (shell) l'appelle pour
 * protéger TOUTES les pages admin, et les pages/actions qui l'appellent
 * aussi ne repaient ni la vérification crypto ni la lecture whitelist.
 */
export const requireAdmin = cache(async function requireAdmin(): Promise<AdminSession> {
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
    // checkRevoked=false : la vérification reste cryptographique (signature +
    // expiration) mais épargne un aller-retour réseau Firebase Auth (~50-200 ms)
    // par requête. Fenêtre de révocation acceptée = TTL du cookie (5 j) ;
    // une révocation immédiate passe par la rotation de la whitelist meta/admins.
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, false);
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
});

/**
 * Garde des PAGES admin (Server Components) : même vérification que
 * requireAdmin, mais session invalide → redirect login au lieu d'un écran
 * d'erreur. À appeler dans CHAQUE page qui lit des données — le guard du
 * layout ne suffit pas : en navigation douce App Router, le layout n'est
 * pas ré-exécuté, seule la page l'est (review 2026-08-13, finding A1).
 * Grâce à React.cache, l'appel est gratuit quand le layout a déjà vérifié.
 */
export async function requireAdminPage(): Promise<AdminSession> {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError) redirect('/admin/login');
    throw e;
  }
}
