# Anti-spam des formulaires : honeypot + écritures Admin SDK + règles fermées

> Spec — 2026-06-27. Statut : validé (design), à implémenter.
> Suite des features A (coordonnées) et B (boîte de demandes). Durcit la
> sécurité des écritures publiques ouvertes par B.

## Contexte & objectif

Les formulaires publics (`/contact`, RDV `/reparation`, location `/location`)
écrivent dans Firestore via des **server actions** utilisant le **client SDK**
(`addDoc`), avec des règles `allow create` **ouvertes**. Conséquence : un bot
peut écrire **directement** dans les collections `demandes` / `reservations`
(sans passer par le formulaire) → spam de la base.

Objectif : **fermer la faille** (seules les server actions écrivent) et
**filtrer les bots** au niveau des formulaires, sans friction pour l'utilisateur.

> **Pourquoi pas Firebase App Check** : App Check vérifie un token reCAPTCHA
> généré dans le **navigateur**. Or nos écritures se font **côté serveur**
> (server actions, pas de token navigateur) → App Check bloquerait nos propres
> écritures. Inadapté à cette architecture.

## Périmètre

- Collections **`demandes`** (contact + RDV réparation) et **`reservations`**
  (location).
- **`orders`** (checkout Stripe) : **hors scope** (flux paiement sensible, à
  durcir séparément).
- reCAPTCHA serveur : hors scope (couche optionnelle B, non retenue).

## Non-objectifs

- Pas de reCAPTCHA / App Check (cf. ci-dessus).
- Pas de rate-limiting persistant (dette #6, séparée).
- `orders` inchangé.

## Architecture

### 1. Écritures publiques via Admin SDK — `lib/server/intake.ts`

Nouveau module **server-only** (Admin SDK, contourne les rules) :

```ts
// lib/server/intake.ts
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Demande } from '@/lib/types';
import type { Reservation } from '@/lib/reservations';

export async function createDemandeIntake(data: Omit<Demande, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('demandes').add(data);
  return ref.id;
}

export async function createReservationIntake(data: Omit<Reservation, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('reservations').add(data);
  return ref.id;
}
```

Consommateurs (remplacent `getAdapter().create*`) :
- `app/contact/actions.ts` (`submitContact`) → `createDemandeIntake`.
- `app/reparation/actions.ts` (`submitRdv`) → `createDemandeIntake`.
- `app/location/actions.ts` (`validateReservation`) → `createReservationIntake`.

> `adapter.createDemande` / `adapter.createReservation` (client SDK) restent dans
> l'adapter pour les tests / le dev, mais ne sont **plus** le chemin de prod.

### 2. Règles Firestore fermées

```
match /demandes/{doc} {
  allow create: if false;     // ← était: allow create
  allow read, update: if isAdmin();
  allow delete: if false;
}
match /reservations/{doc} {
  allow create: if false;     // ← était: allow create
  allow read, update: if isAdmin();
  allow delete: if false;
}
```

→ Aucune écriture client directe possible ; seules les server actions (Admin SDK,
qui contourne les rules) écrivent. **Vérifié** : aucun `create` client direct
n'existe dans le code — tout passe par les server actions.

### 3. Honeypot

Champ piège invisible, rempli seulement par les bots :

- **Formulaires** (`ContactForm`, `RdvForm`, `LocationClient`/form location) :
  un `<input name="website">` masqué — `aria-hidden="true"`, `tabIndex={-1}`,
  `autoComplete="off"`, hors flux visuel (classe utilitaire type
  `position:absolute; left:-9999px` ou `sr-only` + `aria-hidden`). Un humain ne
  le voit ni ne le remplit.
- **Inputs** : `ContactInput` / `RdvInput` / l'input de `validateReservation`
  gagnent `website?: string`.
- **Server actions** : en **toute première instruction**, si `website` est non
  vide → **drop silencieux** : renvoyer une réponse de **succès factice**
  (`{ ok: true, ref: genRef(...), emailed: false }` ou l'équivalent réservation)
  **sans** persister ni envoyer d'email. Le bot croit avoir réussi, rien n'est
  écrit.

### 4. Robustesse / dev local

`createDemandeIntake` / `createReservationIntake` échouent proprement si les
creds Admin SDK sont absents (dev local sans `FIREBASE_ADMIN_*`). Les server
actions encapsulent déjà l'écriture dans un `try/catch` (persist best-effort) →
en dev, l'écriture échoue, l'email best-effort prend le relais, **pas de
régression**. (Pour la location, `validateReservation` renvoie l'erreur
existante si l'écriture échoue — comportement inchangé.)

## Stratégie de test

- **Unit `intake`** : `createDemandeIntake` / `createReservationIntake` appellent
  `getAdminFirestore().collection(X).add(data)` et renvoient l'id (mocks).
- **Honeypot** :
  - `submitContact` / `submitRdv` : `website` rempli → **ni intake ni email
    appelés**, réponse `ok`. `website` vide → intake appelé.
  - `validateReservation` : `website` rempli → pas de création, réponse `ok`-like.
- **Formulaires** : le champ `website` est présent, `aria-hidden`, hors tab order.
- **Règles** : `demandes`/`reservations` `create` refusé (émulateur si dispo,
  sinon vérification manuelle au déploiement — la règle est triviale).

## Impact-map

- **Touche** : nouveau `lib/server/intake.ts` ; `app/contact/actions.ts`,
  `app/reparation/actions.ts`, `app/location/actions.ts` (intake + honeypot) ;
  `app/contact/ContactForm.tsx`, `app/reparation/RdvForm.tsx`,
  `app/location/LocationClient.tsx` (champ honeypot + passage `website`) ;
  `firestore.rules` (demandes + reservations `create: if false`).
- **Casse potentiellement** : les tests `submit-contact-persist` /
  `submit-rdv-persist` (mockaient `getAdapter().createDemande`) → à re-pointer
  sur `createDemandeIntake`. Tests location si présents.
- **Doit préserver** : persist-avant-email (feature B) ; email best-effort ;
  pas de friction pour l'utilisateur (honeypot invisible) ; lecture/gestion BO
  inchangée ; `orders` intact.
- **Ordre de déploiement** : le passage à l'Admin SDK **et** la règle
  `create: if false` doivent partir **ensemble** (sinon les écritures client-SDK
  actuelles casseraient). Déploiement règles = étape ops post-merge.
