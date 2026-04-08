import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import type { User } from 'firebase/auth';

/**
 * Connexion admin + création du session cookie SSR.
 * 1. Firebase Auth côté client (vérification email/password)
 * 2. ID token envoyé à /api/sessionLogin → session cookie HttpOnly (5 jours)
 */
export async function adminSignIn(email: string, password: string): Promise<User> {
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

  return credential.user;
}

/**
 * Déconnexion admin : supprime le session cookie SSR + sign out Firebase Auth.
 */
export async function adminSignOut(): Promise<void> {
  await fetch('/api/sessionLogout', { method: 'POST' });
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
