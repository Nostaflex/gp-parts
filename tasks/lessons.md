# tasks/lessons.md — GP Parts

Lessons learned from corrections. Updated after every mistake.
Claude reads this file at the start of each session.

---

## How to use this file

When the user corrects Claude's behavior, add an entry:

```
### [date] — [short title]
**Mistake:** what Claude did wrong
**Rule:** the rule to apply going forward
**Why:** why it matters for this project
```

---

## Lessons

### 2026-04-08 — SSR + Client Auth Guard

**Mistake:** Page admin (`app/admin/page.tsx`) était un Server Component qui fetchait les données avant que le guard d'auth côté client puisse agir — exposait le HTML avec données inventaire aux utilisateurs non authentifiés.

**Rule:** Tout Server Component sous `/admin/*` qui fetche des données sensibles doit être protégé **côté serveur** (middleware + session cookie), pas uniquement par un guard client-side.

**Why:** Le guard client (`layout.tsx`) s'exécute après la livraison du HTML SSR. Les données sont déjà dans la réponse HTTP à ce moment-là.

**How to apply:** Pour Phase 4 (fix minimal) : déplacer le fetch dans un `useEffect` client. Pour Phase 4.5 : session cookie Firebase + middleware.

---

### 2026-04-08 — Auth Emulator doit être connecté explicitement

**Mistake:** `lib/firebase.ts` connectait l'émulateur Firestore mais pas l'émulateur Auth. Les tests E2E auth échouaient silencieusement contre le vrai service Firebase.

**Rule:** Quand `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`, connecter TOUS les émulateurs utilisés : Firestore (8080) ET Auth (9099).

**Why:** Firebase SDK ne bascule pas automatiquement sur l'émulateur — chaque service doit être explicitement redirigé.

**How to apply:** Dans `lib/firebase.ts`, le bloc émulateur doit appeler `connectFirestoreEmulator` ET `connectAuthEmulator`.

---

### 2026-04-08 — Zod: vérifier que parseProduct couvre tous les chemins Firestore

**Mistake:** `docToProduct()` utilisait Zod, mais `getCategories()` et `getBrands()` lisaient les mêmes documents Firestore avec des `as` casts non validés.

**Rule:** Tout accès à un document Firestore doit passer par `parseProduct()` — pas seulement la méthode principale.

**Why:** Une corruption Firestore sur `category` ou `compatibility` passerait silencieusement dans `getCategories`/`getBrands` et produirait des données invalides sans erreur.

**How to apply:** Remplacer `d.data().field as Type` par `parseProduct({ ...d.data(), id: d.id }).field`.
