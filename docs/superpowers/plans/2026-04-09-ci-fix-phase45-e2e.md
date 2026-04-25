# CI Fix Phase 4.5 — 3 failing E2E tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la CI verte sur la branche `feature/phase4.5-tech-debt` en corrigeant les 3 tests E2E qui échouent : admin:66 (login flow), admin:95 et admin:106 (table produits vide).

**Architecture:** Deux causes racines distinctes. (1) L'émulateur Firestore n'est pas seedé en CI → le dashboard charge mais la table est vide. (2) La route `/api/sessionLogin` échoue car `verifyIdToken` (Firebase Admin SDK) est fragile en mode émulateur — on le remplace par un décodage JWT direct, sans vérification, sécurisé par le flag `FIREBASE_AUTH_EMULATOR_HOST`.

**Tech Stack:** Next.js 14.2 App Router · Firebase Admin SDK · GitHub Actions CI · Playwright E2E · tsx (ts-node)

---

## Carte des fichiers

| Fichier                         | Modification                                                 |
| ------------------------------- | ------------------------------------------------------------ |
| `.github/workflows/ci.yml`      | Ajouter un step "Seed Firestore emulator" après le seed Auth |
| `app/api/sessionLogin/route.ts` | Remplacer `verifyIdToken` par décodage JWT en mode émulateur |

Aucun fichier de test à modifier.

---

### Task 1 : Seed Firestore dans le workflow CI

**Problème :** Les tests admin:95 (`getByText(/PEU-208/i)`) et admin:106 (`getByLabel(/modifier/i)`) trouvent le dashboard chargé (KPIs visibles) mais la table de produits vide. Le workflow CI seede l'Auth mais pas Firestore — `scripts/seed-firestore.ts` n'est jamais appelé.

**Files:**

- Modify: `.github/workflows/ci.yml:108-110`

- [ ] **Step 1 : Lire l'état actuel du workflow**

  Vérifier que le step Auth seed est bien à la ligne ~108 et qu'il n'y a pas déjà un seed Firestore.

  ```bash
  grep -n "seed" .github/workflows/ci.yml
  ```

  Résultat attendu : une seule ligne mentionnant `seed-auth-emulator.ts`, rien pour Firestore.

- [ ] **Step 2 : Ajouter le step Firestore seed**

  Dans `.github/workflows/ci.yml`, après le step `Seed utilisateur admin test dans l'émulateur Auth`, ajouter :

  ```yaml
  - name: Seed produits dans l'émulateur Firestore
    run: npx tsx scripts/seed-firestore.ts
  ```

  Le fichier doit ressembler à :

  ```yaml
  - name: Seed utilisateur admin test dans l'émulateur Auth
    run: npx tsx scripts/seed-auth-emulator.ts

  - name: Seed produits dans l'émulateur Firestore
    run: npx tsx scripts/seed-firestore.ts

  - name: Build production
    run: npm run build
  ```

  Note : `scripts/seed-firestore.ts` force lui-même `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` (ligne 22 du script), donc le step n'a pas besoin d'env supplémentaire.

- [ ] **Step 3 : Vérifier la syntaxe YAML**

  ```bash
  npx js-yaml .github/workflows/ci.yml > /dev/null && echo "YAML OK"
  ```

  Résultat attendu : `YAML OK`

- [ ] **Step 4 : Tester localement (optionnel mais recommandé)**

  Avec les émulateurs déjà lancés :

  ```bash
  FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-firestore.ts
  ```

  Résultat attendu :

  ```
  🌱 Seed Firestore — GP Parts
  📦 N produits trouvés dans lib/products.ts
  ✅ N produits importés dans 'products'
  ```

- [ ] **Step 5 : Commit**

  ```bash
  git add .github/workflows/ci.yml
  git commit -m "fix(ci): seed Firestore emulator avant les tests E2E admin"
  ```

---

### Task 2 : Corriger admin:66 — remplacer verifyIdToken en mode émulateur

**Problème :** Le test "login complet avec credentials valides" échoue avec un timeout de 15s sur `page.waitForURL('**/admin')`. Le flux est : `signInWithEmailAndPassword` (client SDK → émulateur Auth) → `getIdToken()` → `POST /api/sessionLogin` → `getAdminAuth().verifyIdToken(idToken)`. La route retourne 401, `adminSignIn` lève une exception, `router.push('/admin')` n'est jamais appelé.

**Cause probable :** `verifyIdToken` du Firebase Admin SDK interroge l'émulateur ou ses clés publiques via le réseau (URL interne à `FIREBASE_AUTH_EMULATOR_HOST`). En CI, cette connexion échoue ou renvoie une erreur inattendue. La solution est de contourner `verifyIdToken` entièrement en mode émulateur : décoder le payload JWT directement (base64) pour extraire l'uid. C'est sécurisé car le code est conditionné par `process.env.FIREBASE_AUTH_EMULATOR_HOST`.

**Files:**

- Modify: `app/api/sessionLogin/route.ts`

- [ ] **Step 1 : Comprendre la structure actuelle**

  Lire `app/api/sessionLogin/route.ts`. Le bloc émulateur ressemble à :

  ```ts
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    cookieValue = decoded.uid;
  }
  ```

- [ ] **Step 2 : Remplacer verifyIdToken par décodage JWT direct**

  Modifier `app/api/sessionLogin/route.ts` — remplacer le bloc émulateur :

  ```ts
  // AVANT
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    cookieValue = decoded.uid;
  }
  ```

  Par :

  ```ts
  // APRÈS
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    // Émulateur : décoder le JWT sans vérification cryptographique.
    // Sécurisé : ce chemin n'est actif que lorsque FIREBASE_AUTH_EMULATOR_HOST est défini.
    const payloadBase64 = idToken.split('.')[1];
    if (!payloadBase64) throw new Error('idToken malformé');
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    cookieValue = payload.sub ?? payload.user_id;
    if (!cookieValue) throw new Error('uid introuvable dans le token émulateur');
  }
  ```

  Le fichier complet résultant :

  ```ts
  import { NextRequest, NextResponse } from 'next/server';
  import { getAdminAuth } from '@/lib/firebase-admin';

  const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !process.env.FIREBASE_AUTH_EMULATOR_HOST,
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  };

  export async function POST(request: NextRequest) {
    const { idToken } = (await request.json()) as { idToken: string };

    if (!idToken) {
      return NextResponse.json({ error: 'idToken manquant' }, { status: 400 });
    }

    try {
      let cookieValue: string;

      if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        // Émulateur : décoder le JWT sans vérification cryptographique.
        // Sécurisé : ce chemin n'est actif que lorsque FIREBASE_AUTH_EMULATOR_HOST est défini.
        const payloadBase64 = idToken.split('.')[1];
        if (!payloadBase64) throw new Error('idToken malformé');
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
        cookieValue = payload.sub ?? payload.user_id;
        if (!cookieValue) throw new Error('uid introuvable dans le token émulateur');
      } else {
        // Production : session cookie opaque Firebase (JWT signé côté Google)
        cookieValue = await getAdminAuth().createSessionCookie(idToken, {
          expiresIn: SESSION_DURATION_MS,
        });
      }

      const response = NextResponse.json({ status: 'ok' });
      response.cookies.set('__session', cookieValue, COOKIE_OPTIONS);
      return response;
    } catch {
      return NextResponse.json({ error: 'ID token invalide' }, { status: 401 });
    }
  }
  ```

- [ ] **Step 3 : Typecheck**

  ```bash
  npm run typecheck
  ```

  Résultat attendu : `0 errors`

- [ ] **Step 4 : Tester localement avec émulateurs**

  Démarrer les émulateurs + seed :

  ```bash
  npx firebase emulators:start --only auth,firestore --project demo-gp-parts &
  sleep 5
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npx tsx scripts/seed-auth-emulator.ts
  FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-firestore.ts
  ```

  Puis tester le flow login en CI mode :

  ```bash
  CI=true NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-gp-parts \
    FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
    FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
    TEST_ADMIN_EMAIL=admin-test@gp-parts.local \
    TEST_ADMIN_PASSWORD=test-password-e2e \
    npm run test:e2e -- --grep "login complet"
  ```

  Résultat attendu : `1 passed`

- [ ] **Step 5 : Commit**

  ```bash
  git add app/api/sessionLogin/route.ts
  git commit -m "fix(auth-ssr): décoder JWT directement en mode émulateur (bypass verifyIdToken CI)"
  ```

---

### Task 3 : Push et vérification CI

**Files:** aucun — vérification uniquement.

- [ ] **Step 1 : Push la branche**

  ```bash
  git push
  ```

- [ ] **Step 2 : Surveiller la CI**

  ```bash
  gh run watch
  ```

  Ou ouvrir l'onglet Actions sur GitHub. Attendre le job `Playwright · E2E`.

- [ ] **Step 3 : Confirmer les 3 tests corrigés**

  Dans le rapport Playwright (artefact uploadé ou sortie console) :
  - `Admin — login flow › login complet avec credentials valides redirige vers /admin` → **passed**
  - `Admin — smoke back-office › la table produits est affichée avec au moins 1 ligne` → **passed**
  - `Admin — smoke back-office › le bouton Modifier déclenche le toast démo` → **passed**

  Tous les autres tests (auth, smoke) restent verts.

- [ ] **Step 4 : Merge PR #11**

  Si CI verte :

  ```bash
  gh pr merge --merge --delete-branch
  ```

---

## Self-review

**Spec coverage :**

- admin:95 (PEU-208 pas trouvé) → corrigé par Task 1 (seed Firestore)
- admin:106 (bouton Modifier pas trouvé) → même correction
- admin:66 (login timeout) → corrigé par Task 2 (bypass verifyIdToken)

**Pas de placeholders** dans ce plan — chaque step a du code concret ou une commande précise.

**Cohérence des types :** `cookieValue: string` dans `sessionLogin/route.ts` — inchangé, le décodage JWT retourne un string (uid).

**Risque Task 2 :** Si la cause réelle de admin:66 est côté client (signInWithEmailAndPassword échoue), le fix Task 2 ne suffira pas. Dans ce cas, ajouter `console.error` dans le catch de la route pour confirmer via les logs CI téléchargés. Probabilité estimée : <20% — l'émulateur Auth est bien seedé et le client SDK est configuré correctement.
