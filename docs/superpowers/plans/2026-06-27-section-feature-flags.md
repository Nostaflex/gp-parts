# Feature Flags de Sections — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre d'activer/désactiver depuis le back-office la visibilité des sections Pièces, Location, Vente moto et Réparation, de façon étanche (nav + home + footer + route 404 + sitemap) et live (sans redéploiement).

**Architecture:** Un doc Firestore `meta/featureFlags` lu via `unstable_cache` (tag `feature-flags`). Les server components (footer, home strip, sitemap, pages de section) lisent les flags directement ; le seul composant client (`CpHeader`) les reçoit via un React Context posé dans le root layout. Le toggle BO passe par une Server Action (Admin SDK) qui écrit le doc + `revalidateTag`.

**Tech Stack:** Next.js 14.2 App Router, React 18, TypeScript 5.4, Firestore (client SDK lecture / Admin SDK écriture), Vitest + happy-dom + RTL, Playwright.

## Global Constraints

- Sections flaggables : `pieces`, `location`, `venteMoto`, `reparation`. **Jamais** : vente-véhicule, contact, à-propos, légales.
- Défaut si doc Firestore absent = **tout `true`** (ne jamais casser le site existant).
- Prix en centimes, locale FR, design systems non mixés (Volcanic storefront / iOS Clarity back-office) — inchangé ici.
- Aucun redéploiement requis pour flipper un flag → invalidation par `revalidateTag('feature-flags')`.
- Imports ordonnés React → Next.js → lib/ → components/ → types (dernier).
- TDD strict : test rouge → impl minimale → test vert → commit.

---

### Task 1: Module cœur `lib/feature-flags.ts` (types, défauts, helper de visibilité)

**Files:**
- Create: `lib/feature-flags.ts`
- Test: `tests/unit/feature-flags.test.ts`

**Interfaces:**
- Produces:
  - `type FeatureFlags = { pieces: boolean; location: boolean; venteMoto: boolean; reparation: boolean }`
  - `const DEFAULT_FEATURE_FLAGS: FeatureFlags` (tout `true`)
  - `function normalizeFeatureFlags(raw: Partial<FeatureFlags> | null | undefined): FeatureFlags`
  - `function isPathVisible(href: string, flags: FeatureFlags): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/feature-flags.test.ts
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FEATURE_FLAGS,
  normalizeFeatureFlags,
  isPathVisible,
} from '@/lib/feature-flags';

describe('feature-flags', () => {
  it('défaut = toutes sections visibles', () => {
    expect(DEFAULT_FEATURE_FLAGS).toEqual({
      pieces: true,
      location: true,
      venteMoto: true,
      reparation: true,
    });
  });

  it('normalize merge un doc partiel sur les défauts', () => {
    expect(normalizeFeatureFlags({ pieces: false })).toEqual({
      pieces: false,
      location: true,
      venteMoto: true,
      reparation: true,
    });
  });

  it('normalize gère null/undefined → défauts', () => {
    expect(normalizeFeatureFlags(null)).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(normalizeFeatureFlags(undefined)).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('normalize ignore les clés inconnues', () => {
    expect(normalizeFeatureFlags({ foo: true } as never)).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('isPathVisible : section ON visible, OFF masquée', () => {
    const flags = { pieces: false, location: true, venteMoto: false, reparation: true };
    expect(isPathVisible('/pieces', flags)).toBe(false);
    expect(isPathVisible('/pieces?type=auto', flags)).toBe(false);
    expect(isPathVisible('/pieces/clio-4', flags)).toBe(false);
    expect(isPathVisible('/location', flags)).toBe(true);
    expect(isPathVisible('/vente-moto', flags)).toBe(false);
    expect(isPathVisible('/vente-moto/honda-pcx', flags)).toBe(false);
    expect(isPathVisible('/reparation', flags)).toBe(true);
  });

  it('isPathVisible : vente-vehicule & support toujours visibles', () => {
    const allOff = { pieces: false, location: false, venteMoto: false, reparation: false };
    expect(isPathVisible('/vente-vehicule', allOff)).toBe(true);
    expect(isPathVisible('/vente-vehicule/peugeot-308', allOff)).toBe(true);
    expect(isPathVisible('/contact', allOff)).toBe(true);
    expect(isPathVisible('/', allOff)).toBe(true);
  });

  it('isPathVisible : /vente-moto ne matche pas /vente-vehicule', () => {
    const flags = { pieces: true, location: true, venteMoto: false, reparation: true };
    expect(isPathVisible('/vente-vehicule', flags)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feature-flags.test.ts`
Expected: FAIL — `Cannot find module '@/lib/feature-flags'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/feature-flags.ts
// Source de vérité des flags de visibilité des sections du site.
// Lu par le storefront (nav/home/footer/routes/sitemap) et écrit par le
// back-office (Server Action toggleFeatureFlags).

export type FeatureFlags = {
  pieces: boolean;
  location: boolean;
  venteMoto: boolean;
  reparation: boolean;
};

// Défaut = tout visible : une lecture sur un Firestore non seedé ne casse
// jamais le site. L'état de lancement est posé explicitement (seed / BO).
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  pieces: true,
  location: true,
  venteMoto: true,
  reparation: true,
};

/** Merge un doc Firestore (partiel/inconnu) sur les défauts, clés connues only. */
export function normalizeFeatureFlags(
  raw: Partial<FeatureFlags> | null | undefined
): FeatureFlags {
  const src = raw ?? {};
  return {
    pieces: typeof src.pieces === 'boolean' ? src.pieces : DEFAULT_FEATURE_FLAGS.pieces,
    location: typeof src.location === 'boolean' ? src.location : DEFAULT_FEATURE_FLAGS.location,
    venteMoto: typeof src.venteMoto === 'boolean' ? src.venteMoto : DEFAULT_FEATURE_FLAGS.venteMoto,
    reparation:
      typeof src.reparation === 'boolean' ? src.reparation : DEFAULT_FEATURE_FLAGS.reparation,
  };
}

// Préfixe d'URL → flag qui le gouverne. Une route non listée = toujours
// visible (vente-vehicule, contact, a-propos, légales…).
const SECTION_FLAG_BY_PREFIX: { prefix: string; flag: keyof FeatureFlags }[] = [
  { prefix: '/pieces', flag: 'pieces' },
  { prefix: '/location', flag: 'location' },
  { prefix: '/vente-moto', flag: 'venteMoto' },
  { prefix: '/reparation', flag: 'reparation' },
];

/** Un lien/route est-il visible selon les flags ? (gère query + sous-routes) */
export function isPathVisible(href: string, flags: FeatureFlags): boolean {
  const match = SECTION_FLAG_BY_PREFIX.find(
    (s) =>
      href === s.prefix ||
      href.startsWith(`${s.prefix}/`) ||
      href.startsWith(`${s.prefix}?`)
  );
  return match ? flags[match.flag] : true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/feature-flags.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/feature-flags.ts tests/unit/feature-flags.test.ts
git commit -m "feat(flags): module cœur feature-flags (types + défauts + isPathVisible)"
```

---

### Task 2: Adapter `getFeatureFlags` + lecture cachée

**Files:**
- Modify: `lib/data/types.ts` (ajouter méthode à `DataAdapter`)
- Modify: `lib/data/static.ts` (impl `StaticAdapter`)
- Modify: `lib/data/firebase.ts` (impl `FirebaseAdapter`)
- Create: `lib/data/feature-flags-cache.ts`
- Test: `tests/unit/feature-flags-adapter.test.ts`

**Interfaces:**
- Consumes: `FeatureFlags`, `normalizeFeatureFlags`, `DEFAULT_FEATURE_FLAGS` (Task 1).
- Produces:
  - `DataAdapter.getFeatureFlags(): Promise<FeatureFlags>`
  - `getCachedFeatureFlags(): Promise<FeatureFlags>` (cache tag `feature-flags`)

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/feature-flags-adapter.test.ts
import { describe, it, expect } from 'vitest';
import { StaticAdapter } from '@/lib/data/static';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';

describe('StaticAdapter.getFeatureFlags', () => {
  it('renvoie les défauts (dev sans Firebase)', async () => {
    const adapter = new StaticAdapter();
    await expect(adapter.getFeatureFlags()).resolves.toEqual(DEFAULT_FEATURE_FLAGS);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feature-flags-adapter.test.ts`
Expected: FAIL — `getFeatureFlags is not a function` (ou erreur de type TS au build).

- [ ] **Step 3: Write minimal implementation**

Dans `lib/data/types.ts`, ajouter l'import et la méthode à l'interface `DataAdapter` (à la fin du bloc, après `updateReservationStatus`) :

```ts
// en tête, à côté des autres imports de type :
import type { FeatureFlags } from '@/lib/feature-flags';

// dans interface DataAdapter, en dernière ligne avant la `}` :
  getFeatureFlags(): Promise<FeatureFlags>;
```

Dans `lib/data/static.ts`, ajouter l'import et la méthode (n'importe où dans la classe `StaticAdapter`) :

```ts
// en tête :
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';

// méthode dans la classe :
  async getFeatureFlags(): Promise<FeatureFlags> {
    return { ...DEFAULT_FEATURE_FLAGS };
  }
```

Dans `lib/data/firebase.ts`, ajouter l'import et la méthode (`getDoc` et `doc` sont déjà importés) :

```ts
// en tête, à côté des imports de type :
import { normalizeFeatureFlags } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';

// méthode dans la classe FirebaseAdapter :
  async getFeatureFlags(): Promise<FeatureFlags> {
    const snap = await getDoc(doc(db, 'meta', 'featureFlags'));
    return normalizeFeatureFlags(snap.exists() ? (snap.data() as Partial<FeatureFlags>) : null);
  }
```

Créer `lib/data/feature-flags-cache.ts` :

```ts
import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { FeatureFlags } from '@/lib/feature-flags';

/**
 * Lecture publique des flags de sections, cachée et invalidable par tag.
 * `revalidateTag('feature-flags')` (Server Action BO) purge ce cache →
 * nav/home/footer/routes/sitemap régénérés. Même pattern que getCachedVehicules.
 */
export const getCachedFeatureFlags = unstable_cache(
  async (): Promise<FeatureFlags> => {
    const adapter = await getAdapter();
    return adapter.getFeatureFlags();
  },
  ['feature-flags'],
  { tags: ['feature-flags'] }
);
```

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/feature-flags-adapter.test.ts && npx tsc --noEmit`
Expected: test PASS ; tsc sans nouvelle erreur (toutes les impls de `DataAdapter` satisfont l'interface).

- [ ] **Step 5: Commit**

```bash
git add lib/data/types.ts lib/data/static.ts lib/data/firebase.ts lib/data/feature-flags-cache.ts tests/unit/feature-flags-adapter.test.ts
git commit -m "feat(flags): adapter getFeatureFlags + lecture cachée par tag"
```

---

### Task 3: Règle Firestore — lecture publique de `meta/featureFlags`

**Files:**
- Modify: `firestore.rules`

**Contexte (important) :** la règle existante `match /meta/{doc=**} { allow read, write: if isAdmin(); }` rend tout `meta/` **admin-only**. Le storefront lit les flags **non authentifié** → il faut une règle spécifique en lecture publique. Les règles Firestore sont en OR : ajouter une règle plus spécifique qui autorise la lecture suffit.

- [ ] **Step 1: Ajouter la règle**

Dans `firestore.rules`, juste **avant** le bloc `match /meta/{doc=**}` (vers la ligne 61), insérer :

```
    // Feature flags de sections : lecture publique (rendu storefront),
    // écriture admin seulement. Plus spécifique que /meta/{doc=**} ci-dessous.
    match /meta/featureFlags {
      allow read;
      allow write: if isAdmin();
    }
```

- [ ] **Step 2: Vérifier la syntaxe**

Run (si firebase CLI dispo) : `npx firebase deploy --only firestore:rules --dry-run --project car-performance971`
Expected: compile sans erreur de syntaxe.
Sinon, vérification manuelle : le bloc est bien à l'intérieur de `match /databases/{database}/documents { … }`, accolades équilibrées.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(flags): règle Firestore lecture publique meta/featureFlags"
```

> ⚠️ Déploiement des rules (`firebase deploy --only firestore:rules`) = étape ops, faite au déploiement global (voir handoff), pas dans ce commit.

---

### Task 4: Context provider client + câblage root layout

**Files:**
- Create: `components/cp/FeatureFlagsProvider.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/unit/feature-flags-provider.test.tsx`

**Interfaces:**
- Consumes: `FeatureFlags`, `DEFAULT_FEATURE_FLAGS` (Task 1), `getCachedFeatureFlags` (Task 2).
- Produces:
  - `<FeatureFlagsProvider value={FeatureFlags}>` (client)
  - `useFeatureFlags(): FeatureFlags` (client hook)

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/feature-flags-provider.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureFlagsProvider, useFeatureFlags } from '@/components/cp/FeatureFlagsProvider';

function Probe() {
  const flags = useFeatureFlags();
  return <span>{flags.pieces ? 'pieces-on' : 'pieces-off'}</span>;
}

describe('FeatureFlagsProvider', () => {
  it('expose les flags fournis via useFeatureFlags', () => {
    render(
      <FeatureFlagsProvider
        value={{ pieces: false, location: true, venteMoto: true, reparation: true }}
      >
        <Probe />
      </FeatureFlagsProvider>
    );
    expect(screen.getByText('pieces-off')).toBeInTheDocument();
  });

  it('défaut (hors provider) = tout visible', () => {
    render(<Probe />);
    expect(screen.getByText('pieces-on')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feature-flags-provider.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/cp/FeatureFlagsProvider.tsx
'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

export function FeatureFlagsProvider({
  value,
  children,
}: {
  value: FeatureFlags;
  children: React.ReactNode;
}) {
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagsContext);
}
```

Modifier `app/layout.tsx` : rendre le composant `async`, lire les flags, envelopper l'arbre.

```tsx
// ajouter aux imports (après les imports de composants) :
import { FeatureFlagsProvider } from '@/components/cp/FeatureFlagsProvider';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';

// signature : passer de
//   export default function RootLayout({ children }: { children: React.ReactNode }) {
// à :
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const featureFlags = await getCachedFeatureFlags();
  // …reste identique, mais envelopper <ToastProvider>…</ToastProvider> :
```

Dans le JSX, envelopper l'arbre existant (à l'intérieur de `<body>`, autour de `<ToastProvider>`), inchangé sinon :

```tsx
        <FeatureFlagsProvider value={featureFlags}>
          <ToastProvider>
            <CartProvider>
              <main id="main" tabIndex={-1} className="flex-1 flex flex-col">
                {children}
              </main>
              <CookieBanner />
            </CartProvider>
          </ToastProvider>
        </FeatureFlagsProvider>
```

(Le `<JsonLd>` et le `<a className="skip-link">` restent avant `<FeatureFlagsProvider>`.)

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/feature-flags-provider.test.tsx && npx tsc --noEmit`
Expected: PASS (2 tests) ; tsc OK.

- [ ] **Step 5: Commit**

```bash
git add components/cp/FeatureFlagsProvider.tsx app/layout.tsx tests/unit/feature-flags-provider.test.tsx
git commit -m "feat(flags): context provider + lecture flags dans le root layout"
```

---

### Task 5: Filtrage de la nav (`CpHeader`)

**Files:**
- Modify: `components/cp/CpHeader.tsx`
- Test: `tests/unit/cp-header-flags.test.tsx`

**Interfaces:**
- Consumes: `useFeatureFlags` (Task 4), `isPathVisible` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/cp-header-flags.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CpHeader } from '@/components/cp/CpHeader';
import { FeatureFlagsProvider } from '@/components/cp/FeatureFlagsProvider';

function renderHeader(flags: Parameters<typeof FeatureFlagsProvider>[0]['value']) {
  return render(
    <FeatureFlagsProvider value={flags}>
      <CpHeader />
    </FeatureFlagsProvider>
  );
}

describe('CpHeader — filtrage par flags', () => {
  it('section OFF → lien absent ; vente-véhicule toujours présent', () => {
    renderHeader({ pieces: false, location: false, venteMoto: false, reparation: false });
    expect(screen.queryByRole('link', { name: 'Pièces' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Location' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Vente moto' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Réparation' })).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Vente véhicule' }).length).toBeGreaterThan(0);
  });

  it('section ON → lien présent', () => {
    renderHeader({ pieces: true, location: true, venteMoto: true, reparation: true });
    expect(screen.getAllByRole('link', { name: 'Pièces' }).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/cp-header-flags.test.tsx`
Expected: FAIL — liens OFF toujours rendus.

- [ ] **Step 3: Write minimal implementation**

Dans `components/cp/CpHeader.tsx` :

```tsx
// ajouter aux imports (lib avant components) :
import { isPathVisible } from '@/lib/feature-flags';
import { useFeatureFlags } from '@/components/cp/FeatureFlagsProvider';

// dans le composant, avant le return, dériver la liste filtrée :
  const flags = useFeatureFlags();
  const navLinks = NAV_LINKS.filter((l) => isPathVisible(l.href, flags));
```

Puis remplacer les deux `NAV_LINKS.map((l) => …)` (desktop L~87 et mobile L~162) par `navLinks.map((l) => …)`. Ne pas toucher au reste (logo, panier, contact).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/cp-header-flags.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/cp/CpHeader.tsx tests/unit/cp-header-flags.test.tsx
git commit -m "feat(flags): filtrage des liens nav du header selon les flags"
```

---

### Task 6: Filtrage de la home (`CpUniversStrip`)

**Files:**
- Modify: `components/cp/CpUniversStrip.tsx`
- Test: `tests/unit/cp-univers-strip-flags.test.tsx`

**Interfaces:**
- Consumes: `getCachedFeatureFlags` (Task 2), `isPathVisible` (Task 1).
- Note : `CpUniversStrip` est un **server component** → on le rend `async` et il lit les flags directement. Le test mocke le module cache.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/cp-univers-strip-flags.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/data/feature-flags-cache', () => ({
  getCachedFeatureFlags: vi.fn(),
}));
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { CpUniversStrip } from '@/components/cp/CpUniversStrip';

describe('CpUniversStrip — filtrage par flags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('masque les tuiles des sections OFF, garde vente-véhicule', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: false,
      location: false,
      venteMoto: false,
      reparation: false,
    });
    render(await CpUniversStrip());
    expect(screen.queryByText('Pièces détachées')).toBeNull();
    expect(screen.queryByText('Location')).toBeNull();
    expect(screen.getByText('Vente véhicule')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/cp-univers-strip-flags.test.tsx`
Expected: FAIL — composant non async / tuiles OFF rendues.

- [ ] **Step 3: Write minimal implementation**

Dans `components/cp/CpUniversStrip.tsx` :

```tsx
// imports (lib avant components) :
import { isPathVisible } from '@/lib/feature-flags';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';

// passer la fonction composant en async et filtrer UNIVERS :
export async function CpUniversStrip() {
  const flags = await getCachedFeatureFlags();
  const univers = UNIVERS.filter((u) => isPathVisible(u.href, flags));
  // …remplacer la boucle UNIVERS.map(...) par univers.map(...) dans le JSX.
}
```

> Si `CpUniversStrip` était `export function` (non-default), garder le même nom exporté. Le composant reste server (aucun `'use client'` ajouté).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/cp-univers-strip-flags.test.tsx && npx tsc --noEmit`
Expected: PASS ; tsc OK (l'appelant `await`-able : la home rend déjà ce composant dans un arbre server).

- [ ] **Step 5: Commit**

```bash
git add components/cp/CpUniversStrip.tsx tests/unit/cp-univers-strip-flags.test.tsx
git commit -m "feat(flags): filtrage des tuiles d'univers de la home"
```

---

### Task 7: Filtrage du footer (`CpFooter`)

**Files:**
- Modify: `components/cp/CpFooter.tsx`
- Test: `tests/unit/cp-footer-flags.test.tsx`

**Interfaces:**
- Consumes: `getCachedFeatureFlags` (Task 2), `isPathVisible` (Task 1).
- Note : server component → `async`. Le footer a deux groupes de liens sections (groupe « nav » L~20-23 + groupe « Pièces » L~41-44).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/cp-footer-flags.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/data/feature-flags-cache', () => ({
  getCachedFeatureFlags: vi.fn(),
}));
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { CpFooter } from '@/components/cp/CpFooter';

describe('CpFooter — filtrage par flags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('masque liens des sections OFF (nav + groupe Pièces)', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: false,
      location: false,
      venteMoto: false,
      reparation: false,
    });
    render(await CpFooter());
    // liens vers sections OFF absents
    expect(screen.queryByRole('link', { name: 'Réparation' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Location' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Vente moto' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Catalogue' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Promotions' })).toBeNull();
    // toujours présents
    expect(screen.getByRole('link', { name: 'Vente véhicule' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/cp-footer-flags.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Dans `components/cp/CpFooter.tsx` :

```tsx
// imports (lib avant components) :
import { isPathVisible } from '@/lib/feature-flags';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';

// passer le composant en async, lire les flags, filtrer chaque tableau de liens
// AVANT son .map() (le groupe sections ET le groupe Pièces) :
export async function CpFooter() {
  const flags = await getCachedFeatureFlags();
  // pour chaque groupe de liens, filtrer : links.filter((l) => isPathVisible(l.href, flags))
  // ...
}
```

Appliquer `.filter((l) => isPathVisible(l.href, flags))` aux deux tableaux de liens de section (le groupe nav réparation/location/vente-*/  et le groupe « Pièces » catalogue/auto/moto/promo). Ne pas filtrer le groupe support (à-propos/contact/mentions/cgv).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/cp-footer-flags.test.tsx && npx tsc --noEmit`
Expected: PASS ; tsc OK.

- [ ] **Step 5: Commit**

```bash
git add components/cp/CpFooter.tsx tests/unit/cp-footer-flags.test.tsx
git commit -m "feat(flags): filtrage des liens sections du footer"
```

---

### Task 8: Gardes de routes (`notFound()`) sur les 4 sections

**Files:**
- Modify: `app/(boutique)/pieces/page.tsx`
- Modify: `app/(boutique)/pieces/[slug]/page.tsx`
- Modify: `app/location/page.tsx`
- Modify: `app/vente-moto/page.tsx`
- Modify: `app/vente-moto/[id]/page.tsx`
- Modify: `app/reparation/page.tsx`
- Test: `tests/unit/section-route-guards.test.tsx`

**Interfaces:**
- Consumes: `getCachedFeatureFlags` (Task 2), `notFound` (next/navigation).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/section-route-guards.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/data/feature-flags-cache', () => ({ getCachedFeatureFlags: vi.fn() }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { notFound } from 'next/navigation';
import ReparationPage from '@/app/reparation/page';
import LocationPage from '@/app/location/page';

describe('gardes de routes section', () => {
  beforeEach(() => vi.clearAllMocks());

  it('réparation OFF → notFound()', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: true,
      venteMoto: true,
      reparation: false,
    });
    await expect(Promise.resolve().then(() => ReparationPage())).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('location OFF → notFound()', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: false,
      venteMoto: true,
      reparation: true,
    });
    await expect(Promise.resolve().then(() => LocationPage())).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
```

> Note implémenteur : si une `page.tsx` reçoit des props (`params`, `searchParams`), appeler avec un objet minimal, p.ex. `LocationPage({ searchParams: {} } as never)`. Adapter l'invocation à la vraie signature de chaque page.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/section-route-guards.test.tsx`
Expected: FAIL — `notFound` jamais appelé.

- [ ] **Step 3: Write minimal implementation**

En tête du corps de **chaque** `page.tsx` listée, AVANT toute autre logique de données, ajouter la garde correspondante. Exemple pour `app/reparation/page.tsx` :

```tsx
// imports (lib avant le reste, next/navigation avec les autres next) :
import { notFound } from 'next/navigation';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';

// première instruction du composant (rendre async s'il ne l'est pas déjà) :
  const flags = await getCachedFeatureFlags();
  if (!flags.reparation) notFound();
```

Mapping flag par fichier :
- `app/(boutique)/pieces/page.tsx` et `app/(boutique)/pieces/[slug]/page.tsx` → `if (!flags.pieces) notFound();`
- `app/location/page.tsx` → `if (!flags.location) notFound();`
- `app/vente-moto/page.tsx` et `app/vente-moto/[id]/page.tsx` → `if (!flags.venteMoto) notFound();`
- `app/reparation/page.tsx` → `if (!flags.reparation) notFound();`

Si une page n'était pas `async`, la passer en `async` (Next App Router l'autorise pour les Server Components).

- [ ] **Step 4: Run test + build**

Run: `npx vitest run tests/unit/section-route-guards.test.tsx && npm run build`
Expected: tests PASS ; build vert (les pages restent ISR/SSG, la garde s'évalue à la régénération).

- [ ] **Step 5: Commit**

```bash
git add app/\(boutique\)/pieces/page.tsx app/\(boutique\)/pieces/\[slug\]/page.tsx app/location/page.tsx app/vente-moto/page.tsx app/vente-moto/\[id\]/page.tsx app/reparation/page.tsx tests/unit/section-route-guards.test.tsx
git commit -m "feat(flags): garde notFound() sur les routes des sections flaggées"
```

---

### Task 9: Filtrage du sitemap

**Files:**
- Modify: `app/sitemap.ts`
- Test: `tests/unit/sitemap-flags.test.ts`

**Interfaces:**
- Consumes: `getCachedFeatureFlags` (Task 2), `isPathVisible` (Task 1).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/sitemap-flags.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/data/feature-flags-cache', () => ({ getCachedFeatureFlags: vi.fn() }));
vi.mock('@/lib/data', () => ({
  getAdapter: vi.fn(async () => ({
    getProducts: async () => [],
  })),
}));

import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import sitemap from '@/app/sitemap';

describe('sitemap — filtrage par flags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exclut les URLs des sections OFF, garde vente-véhicule', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: false,
      location: false,
      venteMoto: false,
      reparation: false,
    });
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/pieces'))).toBe(false);
    expect(urls.some((u) => u.includes('/location'))).toBe(false);
    expect(urls.some((u) => u.includes('/reparation'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/vente-vehicule'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sitemap-flags.test.ts`
Expected: FAIL — URLs OFF présentes.

- [ ] **Step 3: Write minimal implementation**

Dans `app/sitemap.ts` :

```ts
// imports :
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { isPathVisible } from '@/lib/feature-flags';

// au début de la fonction, après avoir construit `now` :
  const flags = await getCachedFeatureFlags();
  const visible = (url: string) => isPathVisible(url.replace(BASE_URL, ''), flags);

// filtrer les routes statiques avant de les retourner :
  // au lieu de retourner directement [...staticRoutes, ...dynamic], filtrer chaque
  // tableau avec `visible(entry.url)`.
```

Appliquer concrètement :
- Filtrer `staticRoutes` : `staticRoutes.filter((r) => visible(r.url))`.
- Pour les entrées dynamiques produits (`/pieces/[slug]`) : ne les générer que si `flags.pieces` (sinon `[]`).
- Pour les entrées dynamiques motos (`/vente-moto/[id]`) : ne les générer que si `flags.venteMoto`.
- Les entrées véhicules (`/vente-vehicule/[id]`) : inchangées (toujours incluses).
- Le `return` final filtre l'ensemble : `return [...].filter((r) => visible(r.url));` (défense en profondeur).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/sitemap-flags.test.ts && npx tsc --noEmit`
Expected: PASS ; tsc OK.

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts tests/unit/sitemap-flags.test.ts
git commit -m "feat(flags): exclure les sections OFF du sitemap"
```

---

### Task 10: Server Action `toggleFeatureFlags` + type d'audit

**Files:**
- Modify: `lib/admin/audit.ts` (ajouter `'feature-flags'` à `AuditResourceType`)
- Create: `app/admin/(shell)/parametres/actions.ts`
- Test: `tests/unit/feature-flags-action.test.ts`

**Interfaces:**
- Consumes: `requireAdmin` (`lib/admin/auth`), `writeAuditLog` (`lib/admin/audit`), `getAdminFirestore` (`lib/firebase-admin`), `FormActionState` (`components/admin/FormShell`).
- Produces: `toggleFeatureFlags(prev: FormActionState, formData: FormData): Promise<FormActionState>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/feature-flags-action.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const setMock = vi.fn(async () => undefined);
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ uid: 'u1', email: 'admin@test.gp' })),
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ doc: () => ({ set: setMock }) })),
}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { revalidateTag } from 'next/cache';
import { toggleFeatureFlags } from '@/app/admin/(shell)/parametres/actions';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

describe('toggleFeatureFlags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('écrit le doc, audit, revalide', async () => {
    const res = await toggleFeatureFlags(
      {},
      fd({ pieces: 'on', location: '', venteMoto: 'on', reparation: '' })
    );
    expect(requireAdmin).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pieces: true,
        location: false,
        venteMoto: true,
        reparation: false,
        updatedBy: 'admin@test.gp',
      }),
      { merge: true }
    );
    expect(writeAuditLog).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith('feature-flags');
    expect(res).toEqual({ ok: true, message: expect.any(String) });
  });

  it('refuse sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Non authentifié'));
    await expect(toggleFeatureFlags({}, fd({}))).rejects.toThrow('Non authentifié');
    expect(setMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feature-flags-action.test.ts`
Expected: FAIL — module action introuvable.

- [ ] **Step 3: Write minimal implementation**

Dans `lib/admin/audit.ts`, ajouter `'feature-flags'` au union `AuditResourceType` :

```ts
// L20-ish : ajouter la valeur à l'union existante
export type AuditResourceType =
  // …valeurs existantes…
  | 'feature-flags';
```

Créer `app/admin/(shell)/parametres/actions.ts` :

```ts
'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { FeatureFlags } from '@/lib/feature-flags';
import type { FormActionState } from '@/components/admin/FormShell';

export async function toggleFeatureFlags(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const flags: FeatureFlags = {
    pieces: formData.get('pieces') != null && formData.get('pieces') !== '',
    location: formData.get('location') != null && formData.get('location') !== '',
    venteMoto: formData.get('venteMoto') != null && formData.get('venteMoto') !== '',
    reparation: formData.get('reparation') != null && formData.get('reparation') !== '',
  };

  const db = getAdminFirestore();
  await db.doc('meta/featureFlags').set(
    { ...flags, updatedAt: Date.now(), updatedBy: session.email },
    { merge: true }
  );

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'feature-flags',
    resourceId: 'featureFlags',
  });

  revalidateTag('feature-flags');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Visibilité des sections mise à jour.' };
}
```

> Convention : une checkbox HTML cochée envoie sa `value` (ou `'on'`) ; décochée n'envoie rien → `null`. D'où le test `!= null && !== ''`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/feature-flags-action.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests) ; tsc OK.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/audit.ts app/admin/\(shell\)/parametres/actions.ts tests/unit/feature-flags-action.test.ts
git commit -m "feat(flags): server action toggleFeatureFlags + type audit feature-flags"
```

---

### Task 11: Page BO `/admin/parametres` + formulaire + entrée de nav

**Files:**
- Create: `app/admin/(shell)/parametres/page.tsx`
- Create: `components/admin/FeatureFlagsForm.tsx`
- Modify: `components/admin/AdminSidebar.tsx` (ajouter l'entrée « Paramètres »)
- Test: `tests/unit/feature-flags-form.test.tsx`

**Interfaces:**
- Consumes: `toggleFeatureFlags` (Task 10), `getAdminFirestore` (`lib/firebase-admin`), `normalizeFeatureFlags`/`FeatureFlags` (Task 1), `requireAdmin`.

- [ ] **Step 1: Write the failing test (formulaire)**

```tsx
// tests/unit/feature-flags-form.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureFlagsForm } from '@/components/admin/FeatureFlagsForm';

describe('FeatureFlagsForm', () => {
  it('rend un interrupteur par section avec l\'état initial', () => {
    render(
      <FeatureFlagsForm
        initial={{ pieces: false, location: true, venteMoto: false, reparation: true }}
      />
    );
    const pieces = screen.getByRole('checkbox', { name: /pièces/i });
    const location = screen.getByRole('checkbox', { name: /location/i });
    expect(pieces).not.toBeChecked();
    expect(location).toBeChecked();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feature-flags-form.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write minimal implementation**

Créer `components/admin/FeatureFlagsForm.tsx` (client, design iOS Clarity — interrupteurs natifs, on garde simple et accessible) :

```tsx
'use client';

import { useActionState } from 'react';
import { toggleFeatureFlags } from '@/app/admin/(shell)/parametres/actions';
import type { FeatureFlags } from '@/lib/feature-flags';
import type { FormActionState } from '@/components/admin/FormShell';

const SECTIONS: { key: keyof FeatureFlags; label: string }[] = [
  { key: 'pieces', label: 'Pièces (boutique)' },
  { key: 'location', label: 'Location' },
  { key: 'venteMoto', label: 'Vente moto' },
  { key: 'reparation', label: 'Réparation' },
];

export function FeatureFlagsForm({ initial }: { initial: FeatureFlags }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    toggleFeatureFlags,
    {}
  );

  return (
    <form action={formAction} className="admin-card" style={{ display: 'grid', gap: 16 }}>
      {SECTIONS.map((s) => (
        <label key={s.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{s.label}</span>
          <input
            type="checkbox"
            name={s.key}
            defaultChecked={initial[s.key]}
            aria-label={s.label}
          />
        </label>
      ))}
      <button type="submit" disabled={pending} className="admin-btn-primary">
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {state.ok && <p role="status">{state.message}</p>}
    </form>
  );
}
```

> Note design : reprendre le style d'interrupteur iOS existant si un composant
> Toggle est déjà présent dans `components/admin/` ; sinon la checkbox stylée
> suffit pour une v1. Ne PAS mélanger les tokens Volcanic (storefront).

Créer `app/admin/(shell)/parametres/page.tsx` (server) :

```tsx
import { requireAdmin } from '@/lib/admin/auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeFeatureFlags } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';
import { FeatureFlagsForm } from '@/components/admin/FeatureFlagsForm';

export const dynamic = 'force-dynamic';

export default async function ParametresPage() {
  await requireAdmin();
  const snap = await getAdminFirestore().doc('meta/featureFlags').get();
  const initial: FeatureFlags = normalizeFeatureFlags(
    snap.exists ? (snap.data() as Partial<FeatureFlags>) : null
  );

  return (
    <section>
      <h1>Visibilité des sections</h1>
      <p>Activez ou désactivez les sections publiques du site. Effet immédiat.</p>
      <FeatureFlagsForm initial={initial} />
    </section>
  );
}
```

Ajouter l'entrée de nav dans `components/admin/AdminSidebar.tsx` : repérer le tableau des liens (`grep -n "href" components/admin/AdminSidebar.tsx`) et ajouter, dans le même format que les entrées existantes :

```tsx
{ href: '/admin/parametres', label: 'Paramètres' /* + icône au même format que les autres */ },
```

- [ ] **Step 4: Run test + build**

Run: `npx vitest run tests/unit/feature-flags-form.test.tsx && npm run build`
Expected: test PASS ; build vert ; route `/admin/parametres` listée comme dynamique.

- [ ] **Step 5: Commit**

```bash
git add app/admin/\(shell\)/parametres/page.tsx components/admin/FeatureFlagsForm.tsx components/admin/AdminSidebar.tsx tests/unit/feature-flags-form.test.tsx
git commit -m "feat(flags): page BO Paramètres + formulaire toggles + entrée sidebar"
```

---

### Task 12: Script de seed + E2E + suite complète

**Files:**
- Create: `scripts/seed-feature-flags.ts`
- Create: `tests/e2e/section-feature-flags.spec.ts`

**Interfaces:**
- Consumes: pattern `scripts/seed-admin-whitelist.ts`.

- [ ] **Step 1: Créer le script de seed**

```ts
// scripts/seed-feature-flags.ts
/**
 * Pose l'état de visibilité des sections dans Firestore (meta/featureFlags).
 *
 * Usage (état de lancement « Vente véhicule seule ») :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance971 \
 *   FLAGS_PIECES=false FLAGS_LOCATION=false FLAGS_VENTE_MOTO=false FLAGS_REPARATION=false \
 *   npx tsx scripts/seed-feature-flags.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('ERROR: Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path');
  process.exit(1);
}
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('ERROR: Set NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  process.exit(1);
}

const bool = (v: string | undefined, def: boolean) =>
  v == null ? def : v.toLowerCase() === 'true';

const flags = {
  pieces: bool(process.env.FLAGS_PIECES, true),
  location: bool(process.env.FLAGS_LOCATION, true),
  venteMoto: bool(process.env.FLAGS_VENTE_MOTO, true),
  reparation: bool(process.env.FLAGS_REPARATION, true),
  updatedAt: Date.now(),
  updatedBy: 'seed-script',
};

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf-8'));
initializeApp({ credential: cert(serviceAccount), projectId });

getFirestore()
  .doc('meta/featureFlags')
  .set(flags, { merge: true })
  .then(() => {
    console.log('✓ meta/featureFlags =', JSON.stringify(flags));
    process.exit(0);
  })
  .catch((err) => {
    console.error('seed-feature-flags failed:', err);
    process.exit(1);
  });
```

- [ ] **Step 2: Écrire l'E2E**

```ts
// tests/e2e/section-feature-flags.spec.ts
import { test, expect } from '@playwright/test';

// Hypothèse : en CI/dev local sans Firebase, StaticAdapter → tout ON.
// Cet E2E vérifie le chemin « tout visible » (non-régression). Le chemin
// « section OFF → 404 » est couvert par les tests unitaires de garde (Task 8)
// et vérifié manuellement sur l'environnement Firebase au déploiement.

test('toutes les sections visibles par défaut (StaticAdapter)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Vente véhicule' }).first()).toBeVisible();
  await page.goto('/reparation');
  await expect(page).toHaveURL(/\/reparation/);
  await page.goto('/pieces');
  await expect(page).toHaveURL(/\/pieces/);
});
```

- [ ] **Step 3: Lancer la suite complète + build**

Run:
```bash
npx vitest run
npm run build
npx playwright test tests/e2e/section-feature-flags.spec.ts
```
Expected: tous les unitaires verts (dont les 7 nouveaux fichiers), build vert, E2E vert.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-feature-flags.ts tests/e2e/section-feature-flags.spec.ts
git commit -m "feat(flags): script de seed meta/featureFlags + E2E non-régression"
```

---

## Self-Review

**Spec coverage :**
- Data model `meta/featureFlags` → Task 2 (firebase) + Task 10/11 (écriture) + Task 12 (seed). ✓
- `DEFAULT_FEATURE_FLAGS` → Task 1. ✓
- `getCachedFeatureFlags` (tag) → Task 2. ✓
- 5 points de garde (nav/home/footer/route/sitemap) → Tasks 5/6/7/8/9. ✓
- Page BO + toggle action → Tasks 10/11. ✓
- Cache & SEO (revalidate) → Task 10 (revalidateTag + revalidatePath). ✓
- Règle Firestore lecture publique → Task 3. ✓
- Seed de lancement (tout OFF sauf vente-véhicule) → Task 12. ✓
- Tests (unit/action/E2E/anti-régression) → chaque task + Task 12. ✓

**Placeholder scan :** aucun TBD/TODO ; code complet à chaque étape. Le seul renvoi « repérer via grep » (entrée sidebar, Task 11) fournit la commande exacte + le format de l'entrée. ✓

**Type consistency :** `FeatureFlags` (clés `pieces/location/venteMoto/reparation`) identique partout ; `getFeatureFlags` / `getCachedFeatureFlags` / `toggleFeatureFlags` / `isPathVisible` / `normalizeFeatureFlags` noms stables across tasks ; `AuditResourceType` étendu (Task 10) avant usage (Task 10/11). ✓

## Ordre de dépendance

1 → 2 → 3 → 4 → 5/6/7 (parallélisables) → 8 → 9 → 10 → 11 → 12.
(5/6/7 dépendent de 1+2+4 ; 8/9 de 1+2 ; 10 de 1 ; 11 de 10 ; 12 de tout.)
