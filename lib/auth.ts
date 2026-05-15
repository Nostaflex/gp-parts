import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import type { User } from 'firebase/auth';

/**
 * Connexion admin + création du session cookie SSR.
 *
 * Mode émulateur (NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') :
 *   → Appel à /api/admin/emulator-login (côté serveur) pour éviter les problèmes
 *     de connectivité browser → émulateur en CI (127.0.0.1:9099 inaccessible depuis Chromium).
 *
 * Mode production :
 *   1. Firebase Auth côté client (vérification email/password)
 *   2. ID token envoyé à /api/sessionLogin → session cookie HttpOnly (5 jours)
 */
export async function adminSignIn(email: string, password: string): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    // En mode émulateur : login via API route côté serveur.
    // Évite les problèmes de connectivité browser → émulateur en CI.
    const res = await fetch('/api/admin/emulator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error('Credentials invalides');
    }
    return;
  }

  // Production : Firebase Client SDK → session cookie Firebase
  const credential = await signInWithEmailAndPassword(auth, email, password);

  const idToken = await credential.user.getIdToken();
  const res = await fetch('/api/sessionLogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    // Session cookie non créé — déconnecter Firebase Auth pour garder la cohérence
    await signOut(auth);
    throw new Error('Impossible de créer la session serveur');
  }
}

/**
 * Déconnexion admin : supprime le session cookie SSR + sign out Firebase Auth.
 */
export async function adminSignOut(): Promise<void> {
  await fetch('/api/sessionLogout', { method: 'POST' });
  await signOut(auth);
}

/**
 * Force le rafraîchissement de la session admin.
 *
 * Récupère un ID token frais (`getIdToken(true)`) et recrée le session
 * cookie SSR. Utile si la whitelist `meta/admins` a changé après le login
 * (ajout/retrait d'un admin) — évite d'attendre l'expiration du cookie 5j.
 *
 * No-op en mode émulateur (le cookie émulateur n'a pas de TTL court).
 */
export async function refreshAdminSession(): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Aucune session active');
  }

  const idToken = await user.getIdToken(true);
  const res = await fetch('/api/sessionLogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    throw new Error('Impossible de rafraîchir la session serveur');
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
