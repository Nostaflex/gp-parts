# Phase 4 — Firebase Cloud + Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer GP Parts des données statiques + Basic Auth vers Firestore cloud + Firebase Auth, rendant le site prêt pour un vrai catalogue administrable.

**Architecture:** On remplace le middleware Basic Auth par une page login admin avec Firebase Auth (email/password). On connecte le FirebaseAdapter existant à un projet Firestore cloud (au lieu de l'émulateur). On ajoute Zod pour valider les données Firestore à l'exécution. On seed le catalogue statique vers Firestore cloud.

**Tech Stack:** Next.js 14.2 App Router, Firebase Auth + Firestore, Zod, Vitest, Playwright

---

## File Structure

| File                                 | Responsibility                                              |
| ------------------------------------ | ----------------------------------------------------------- |
| `lib/firebase.ts`                    | Modify — ajouter Firebase Auth init                         |
| `lib/auth.ts`                        | Create — helpers auth (signIn, signOut, onAuthChange)       |
| `lib/schemas/product.ts`             | Create — Zod schema Product, parser sécurisé                |
| `lib/data/firebase.ts`               | Modify — remplacer `as` casts par Zod parse                 |
| `app/admin/login/page.tsx`           | Create — page login admin                                   |
| `app/admin/layout.tsx`               | Create — layout admin avec auth guard                       |
| `app/admin/AdminDashboardClient.tsx` | Modify — ajouter bouton logout                              |
| `middleware.ts`                      | Modify — retirer Basic Auth, laisser passer vers login page |
| `scripts/seed-firestore-cloud.ts`    | Create — seeder pour Firestore cloud                        |
| `tests/unit/schemas/product.test.ts` | Create — tests Zod schema                                   |
| `tests/unit/auth.test.ts`            | Create — tests helpers auth                                 |
| `tests/e2e/admin-auth.spec.ts`       | Create — test E2E login/logout admin                        |

---

### Task 1: Zod Schema pour Product

**Files:**

- Create: `lib/schemas/product.ts`
- Test: `tests/unit/schemas/product.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/schemas/product.test.ts
import { describe, it, expect } from 'vitest';
import { parseProduct, productSchema } from '@/lib/schemas/product';

describe('productSchema', () => {
  const validProduct = {
    id: 'prod-001',
    slug: 'plaquettes-frein-clio-iv',
    name: 'Plaquettes de frein Clio IV',
    reference: 'REN-CLO4-DBF-001',
    description: 'Plaquettes de frein avant pour Renault Clio IV',
    shortDescription: 'Plaquettes frein avant',
    price: 2990,
    images: ['/images/plaquettes.jpg'],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }],
    stock: 15,
    isPromoted: false,
    createdAt: '2025-01-15T10:00:00Z',
  };

  it('parses a valid product', () => {
    const result = parseProduct(validProduct);
    expect(result.id).toBe('prod-001');
    expect(result.price).toBe(2990);
  });

  it('accepts optional priceOriginal', () => {
    const result = parseProduct({ ...validProduct, priceOriginal: 3990 });
    expect(result.priceOriginal).toBe(3990);
  });

  it('throws on missing required field', () => {
    const { name, ...incomplete } = validProduct;
    expect(() => parseProduct(incomplete)).toThrow();
  });

  it('throws on price as float', () => {
    expect(() => parseProduct({ ...validProduct, price: 29.9 })).toThrow();
  });

  it('throws on invalid category', () => {
    expect(() => parseProduct({ ...validProduct, category: 'invalid' })).toThrow();
  });

  it('throws on negative stock', () => {
    expect(() => parseProduct({ ...validProduct, stock: -1 })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/schemas/product.test.ts`
Expected: FAIL — module `@/lib/schemas/product` not found

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/schemas/product.ts
import { z } from 'zod';
import type { Product } from '@/lib/types';

const vehicleCompatibilitySchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  yearFrom: z.number().int().min(1900),
  yearTo: z.number().int().min(1900).optional(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  reference: z.string().min(1),
  description: z.string(),
  shortDescription: z.string(),
  price: z.number().int().nonnegative(),
  priceOriginal: z.number().int().nonnegative().optional(),
  images: z.array(z.string()),
  category: z.enum([
    'freinage',
    'moteur',
    'transmission',
    'eclairage',
    'filtres',
    'suspension',
    'electronique',
    'refroidissement',
  ]),
  vehicleType: z.enum(['auto', 'moto']),
  compatibility: z.array(vehicleCompatibilitySchema),
  stock: z.number().int().nonnegative(),
  isPromoted: z.boolean(),
  createdAt: z.string(),
});

/**
 * Parse et valide un document Firestore en Product.
 * Throws ZodError si les données sont corrompues.
 */
export function parseProduct(data: unknown): Product {
  return productSchema.parse(data) as Product;
}
```

- [ ] **Step 4: Install Zod**

Run: `npm install zod`

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/schemas/product.test.ts`
Expected: 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/schemas/product.ts tests/unit/schemas/product.test.ts package.json package-lock.json
git commit -m "feat(phase4): add Zod product schema with validation"
```

---

### Task 2: Intégrer Zod dans FirebaseAdapter

**Files:**

- Modify: `lib/data/firebase.ts:33-53` (remplacer docToProduct)
- Test: `tests/unit/data-adapter.test.ts` (ajouter test validation)

- [ ] **Step 1: Write the failing test**

Ajouter ce test dans `tests/unit/data-adapter.test.ts` :

```ts
// Ajouter dans le describe existant
import { parseProduct } from '@/lib/schemas/product';

describe('parseProduct integration', () => {
  it('rejects Firestore doc with missing slug', () => {
    const badDoc = {
      id: 'bad-001',
      name: 'Bad Product',
      reference: 'BAD-001',
      description: 'Missing slug',
      shortDescription: 'Bad',
      price: 1000,
      images: [],
      category: 'freinage',
      vehicleType: 'auto',
      compatibility: [],
      stock: 5,
      isPromoted: false,
      createdAt: '2025-01-01',
    };
    expect(() => parseProduct(badDoc)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it passes** (parseProduct already throws on missing slug)

Run: `npx vitest run tests/unit/data-adapter.test.ts`
Expected: PASS

- [ ] **Step 3: Replace `as` casts with Zod in FirebaseAdapter**

Replace `docToProduct` in `lib/data/firebase.ts`:

```ts
import { parseProduct } from '@/lib/schemas/product';

// Replace the entire docToProduct method:
private docToProduct(docSnap: { id: string; data: () => Record<string, unknown> }): Product {
  const data = docSnap.data();
  return parseProduct({ ...data, id: docSnap.id });
}
```

- [ ] **Step 4: Run all unit tests**

Run: `npx vitest run`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/data/firebase.ts tests/unit/data-adapter.test.ts
git commit -m "feat(phase4): replace as-casts with Zod validation in FirebaseAdapter"
```

---

### Task 3: Firebase Auth helpers

**Files:**

- Modify: `lib/firebase.ts` (ajouter auth init)
- Create: `lib/auth.ts`
- Test: `tests/unit/auth.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/auth.test.ts
import { describe, it, expect, vi } from 'vitest';

// Mock Firebase Auth avant l'import
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  default: {},
  db: {},
}));

import { adminSignIn, adminSignOut } from '@/lib/auth';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

describe('auth helpers', () => {
  it('adminSignIn calls signInWithEmailAndPassword', async () => {
    const mockSignIn = vi.mocked(signInWithEmailAndPassword);
    mockSignIn.mockResolvedValueOnce({ user: { uid: '123' } } as never);

    await adminSignIn('admin@gp-parts.com', 'password');
    expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), 'admin@gp-parts.com', 'password');
  });

  it('adminSignOut calls signOut', async () => {
    const mockSignOut = vi.mocked(signOut);
    mockSignOut.mockResolvedValueOnce(undefined);

    await adminSignOut();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/auth.test.ts`
Expected: FAIL — module `@/lib/auth` not found

- [ ] **Step 3: Add Auth to firebase.ts**

Add at the end of `lib/firebase.ts`, before the exports:

```ts
import { getAuth } from 'firebase/auth';

const auth = getAuth(app);

export { db, auth };
export default app;
```

- [ ] **Step 4: Create auth helpers**

```ts
// lib/auth.ts
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import type { User } from 'firebase/auth';

export async function adminSignIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function adminSignOut(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
```

- [ ] **Step 5: Install Firebase Auth dependency** (déjà incluse dans `firebase` package, vérifier)

Run: `npx vitest run tests/unit/auth.test.ts`
Expected: 2 tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/firebase.ts lib/auth.ts tests/unit/auth.test.ts
git commit -m "feat(phase4): add Firebase Auth helpers (signIn, signOut, onAuthChange)"
```

---

### Task 4: Page Login Admin

**Files:**

- Create: `app/admin/login/page.tsx`
- Create: `app/admin/layout.tsx`
- Modify: `app/admin/AdminDashboardClient.tsx` (ajouter bouton logout)

- [ ] **Step 1: Create admin login page**

```tsx
// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminSignIn } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminSignIn(email, password);
      router.push('/admin');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ color: 'var(--text)', marginBottom: '1.5rem' }}>Admin GP Parts</h1>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
          Email
        </label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border, #ddd)',
          }}
        />

        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
          Mot de passe
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border, #ddd)',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--blue)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create admin layout with auth guard**

```tsx
// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';

import type { User } from 'firebase/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setChecking(false);

      // Si pas connecté et pas sur la page login → rediriger
      if (!firebaseUser && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    return unsubscribe;
  }, [router, pathname]);

  // Page login : pas de guard
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Vérification en cours
  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <p>Chargement...</p>
      </div>
    );
  }

  // Pas connecté (en cours de redirection)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Add logout button to AdminDashboardClient**

Ajouter en haut du dashboard existant dans `app/admin/AdminDashboardClient.tsx` :

```tsx
// Ajouter ces imports en haut
import { adminSignOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Ajouter dans le composant, dans le header/nav area :
<button
  onClick={async () => {
    await adminSignOut();
    router.push('/admin/login');
  }}
  style={{
    background: 'transparent',
    border: '1px solid var(--border, #ddd)',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    color: 'var(--text)',
  }}
>
  Déconnexion
</button>;
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add app/admin/login/page.tsx app/admin/layout.tsx app/admin/AdminDashboardClient.tsx
git commit -m "feat(phase4): add Firebase Auth login page + admin auth guard"
```

---

### Task 5: Retirer Basic Auth du middleware

**Files:**

- Modify: `middleware.ts`

- [ ] **Step 1: Replace middleware.ts**

```ts
// middleware.ts
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

/**
 * Phase 4 : l'authentification admin est gérée côté client par Firebase Auth
 * (voir app/admin/layout.tsx). Le middleware n'a plus besoin de Basic Auth.
 *
 * On garde le middleware pour de futures protections (CSP headers, redirects, etc.)
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 2: Run build to verify nothing breaks**

Run: `npm run build`
Expected: build green

- [ ] **Step 3: Run E2E admin tests**

Run: `npx playwright test tests/e2e/admin.spec.ts`
Expected: tests may need updating (they used Basic Auth headers) — note failures for Task 7

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "refactor(phase4): remove Basic Auth middleware, auth now via Firebase Auth"
```

---

### Task 6: Configuration Firebase Cloud

**Files:**

- Modify: `lib/firebase.ts` (ajuster la logique emulator vs cloud)
- Create: `.env.example` (documenter les env vars requises)

- [ ] **Step 1: Update .env.example**

```bash
# .env.example — Variables d'environnement GP Parts
# Copier vers .env.local et remplir les valeurs

# Firebase (requis pour Firestore cloud)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Emulateur local (mettre true pour dev avec emulateur)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

- [ ] **Step 2: Verify firebase.ts handles cloud mode correctly**

Le fichier `lib/firebase.ts` gère déjà le switch emulator/cloud via `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`. Vérifier que la logique est correcte — si la variable est `false` ou absente, il se connecte au cloud avec les env vars. Aucun changement de code nécessaire si c'est déjà le cas.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs(phase4): add .env.example with Firebase cloud env vars"
```

---

### Task 7: Seeder Firestore Cloud

**Files:**

- Create: `scripts/seed-firestore-cloud.ts`

- [ ] **Step 1: Create the cloud seeder script**

```ts
// scripts/seed-firestore-cloud.ts
/**
 * Seed Firestore cloud avec les produits statiques.
 * Usage: NEXT_PUBLIC_FIREBASE_PROJECT_ID=gp-parts-prod npx tsx scripts/seed-firestore-cloud.ts
 *
 * ATTENTION : écrase les documents existants avec le même ID.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PRODUCTS } from '../lib/products';

// Utilise le service account pour écrire en admin
// Le fichier service-account.json NE DOIT PAS être commité (ajouté au .gitignore)
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('ERROR: Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-gp-parts',
});

const db = getFirestore();

async function seed() {
  console.log(`Seeding ${PRODUCTS.length} products to Firestore cloud...`);

  const batch = db.batch();

  for (const product of PRODUCTS) {
    const ref = db.collection('products').doc(product.id);
    batch.set(ref, product);
  }

  await batch.commit();
  console.log(`Done! ${PRODUCTS.length} products seeded.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add service account to .gitignore**

Verify `.gitignore` contains `service-account*.json`. If not, add it.

- [ ] **Step 3: Install firebase-admin**

Run: `npm install -D firebase-admin`

- [ ] **Step 4: Add npm script**

Add to `package.json` scripts:

```json
"firebase:seed:cloud": "tsx scripts/seed-firestore-cloud.ts"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-firestore-cloud.ts package.json package-lock.json .gitignore
git commit -m "feat(phase4): add Firestore cloud seeder script"
```

---

### Task 8: Update E2E tests for Firebase Auth

**Files:**

- Modify: `tests/e2e/admin.spec.ts`

- [ ] **Step 1: Update admin E2E tests to use login form instead of Basic Auth**

```ts
// tests/e2e/admin.spec.ts
import { test, expect } from '@playwright/test';

// Helper : se connecter via la page login
async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input[name="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@gp-parts.com');
  await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'test-password');
  await page.click('button[type="submit"]');
  // Attendre la redirection vers /admin
  await page.waitForURL('/admin', { timeout: 10000 });
}

test.describe('Admin — smoke back-office', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('la page /admin charge et affiche les 4 KPIs', async ({ page }) => {
    await expect(page.locator('[data-testid="kpi"]')).toHaveCount(4);
  });

  test('la table produits est affichée avec au moins 1 ligne', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('les filtres fonctionnent (Stock faible)', async ({ page }) => {
    await page.click('text=Stock faible');
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('le bouton Modifier déclenche le toast démo', async ({ page }) => {
    await page.click('text=Modifier');
    await expect(page.locator('[role="alert"], .toast')).toBeVisible();
  });
});

test.describe('Admin — auth', () => {
  test('accès /admin sans login redirige vers /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('/admin/login', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Admin GP Parts');
  });

  test('login avec mauvais credentials affiche erreur', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=incorrect')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test tests/e2e/admin.spec.ts`
Note: nécessite un utilisateur Firebase Auth créé dans la console Firebase ou l'émulateur.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/admin.spec.ts
git commit -m "test(phase4): update admin E2E tests for Firebase Auth login"
```

---

### Task 9: Verification finale

- [ ] **Step 1: Run full verification checklist**

```bash
npm run typecheck   # 0 TypeScript errors
npm run lint        # 0 warnings
npm run build       # build green
npx vitest run      # all unit tests pass
```

- [ ] **Step 2: Run E2E tests**

```bash
npx playwright test
```

- [ ] **Step 3: Verify in browser**

1. Aller sur `/admin` → doit rediriger vers `/admin/login`
2. Login avec les credentials → doit afficher le dashboard
3. Cliquer Déconnexion → doit revenir sur `/admin/login`
4. Le storefront (`/`, `/catalogue`) fonctionne toujours normalement

- [ ] **Step 4: Final commit + tag**

```bash
git add -A
git commit -m "chore(phase4): verification pass — all checks green"
git tag v0.4.0
```

---

## Self-Review Checklist

- **Spec coverage:** Toutes les tâches Phase 4 du CLAUDE.md sont couvertes (Firebase cloud, Auth, Zod, seeder, switch adapter)
- **Placeholder scan:** Aucun TBD/TODO — chaque step a du code complet
- **Type consistency:** `parseProduct` utilisé de manière cohérente dans Task 1, 2. `adminSignIn`/`adminSignOut`/`onAuthChange` nommés de manière cohérente dans Task 3, 4, 5, 8.
- **Design Systems:** Login page utilise `var(--*)` tokens (iOS Clarity) — correct pour `app/admin/`
