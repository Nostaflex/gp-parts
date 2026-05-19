# Admin CMS Phase 5 — CRUD Produits — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** CRUD admin produits sécurisé (création/édition/soft-delete/restore) + rewire du catalogue public statique→ISR, durci selon les 28 exigences du threat model.

**Architecture:** Miroir du pattern 4a/4b (CRUD véhicules/motos mergés, `0b91151`/`0774de9`) appliqué à `Product`, avec : soft-delete 4 couches (query + by-key + rules + invalidation immédiate), schéma write `.strict()` anti-mass-assignment, bornes input, CSP nonce. Les fichiers moto/véhicule **mergés sur main** sont le template de référence (à lire, pas à re-transcrire) ; le nouveau/sécurité-critique est explicité en entier ici.

**Tech Stack:** Next.js 15.5 App Router, React 19, Firebase Admin SDK + client SDK, Zod, Vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-18-admin-cms-phase5-produits-design.md` (28 exigences numérotées §9 — chaque task cite les exigences qu'elle satisfait).

**Branche:** `feat/admin-cms-phase5-produits` (créée, contient déjà le commit du design).

---

## Leçons pré-intégrées (éviter les escalades 4a/4b/P0)

1. `generateStaticParams` lit l'adapter DIRECT (`await import('@/lib/data')` → `getProducts()`), JAMAIS `getCachedProducts()` (`unstable_cache` throw hors contexte requête).
2. `parseForm` strip `undefined`/vides (Firestore Admin rejette `undefined`) ; numériques posés seulement si valides.
3. Conflit optimistic-lock → `{ errors: { _form: [...] } }` (forme `FormActionState` existante). `writeAuditLog` POST-commit.
4. Form responsive `grid grid-cols-1 sm:grid-cols-N` (Stéphane mobile). `sanitize()` identique `commande/actions.ts`.
5. **Coverage gate (leçon 4b)** : `ProductForm` testé RTL DÈS Task 7 (pas après CI rouge). CI lance `vitest run --coverage` (seuils lines≥55/fn≥55/br≥50).
6. **Firestore `deletedAt`** : champ TOUJOURS présent (`null` actif) — `where('deletedAt','==',null)` ne matche pas les champs absents.
7. **E2E admin auth (leçon P0 #23)** : `seed-firestore.ts` écrit `meta/admins` via Admin SDK (déjà mergé #23) ; NE PAS réintroduire de REST PATCH non-auth. `seed-firestore.ts` gardé par `if (!process.env.FIRESTORE_EMULATOR_HOST) process.exit(1)`.
8. JSON-LD : `safeJsonLd` existe (`lib/safe-json-ld.ts`, P0 #23) — réutiliser, ne pas réécrire.

## File Structure

| Fichier                                                                  | Action                                        | Template (lire sur main)                                     |
| ------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------ |
| `lib/types.ts`                                                           | Modifier (+`updatedAt`,`deletedAt`)           | —                                                            |
| `lib/products.ts`                                                        | Modifier (fixtures +champs)                   | `lib/motos.ts` (pattern 4b)                                  |
| `lib/schemas/product.ts`                                                 | Modifier (Write `.strict()` + Read + bornes)  | `lib/schemas/moto.ts`                                        |
| `lib/data/types.ts`                                                      | Modifier (`ProductFilters.includeDeleted`)    | —                                                            |
| `lib/data/static.ts`                                                     | Modifier (filtre query+by-key)                | bloc products existant                                       |
| `lib/data/firebase.ts`                                                   | Modifier (filtre query+by-key)                | bloc products existant                                       |
| `lib/data/products-cache.ts`                                             | Créer                                         | `lib/data/motos-cache.ts`                                    |
| `firestore.rules`                                                        | Modifier (products read `deletedAt`)          | bloc `/products` existant                                    |
| `app/admin/products/actions.ts`                                          | Créer                                         | `app/admin/motos/actions.ts`                                 |
| `components/admin/CompatibilityFields.tsx`                               | Créer                                         | — (nouveau, code complet ici)                                |
| `components/admin/ProductForm.tsx`                                       | Créer                                         | `components/admin/MotoForm.tsx`                              |
| `app/admin/(shell)/products/{page,ProductsTable,new/page,[id]/page}.tsx` | Créer                                         | `app/admin/(shell)/motos/*`                                  |
| `app/(boutique)/pieces/CatalogueClient.tsx`                              | Modifier (prop, drop static import)           | `app/vente-moto/VenteMotoClient.tsx` (pattern)               |
| `app/(boutique)/pieces/page.tsx` (ou route liste)                        | Modifier (async ISR)                          | `app/vente-moto/page.tsx`                                    |
| `app/(boutique)/pieces/[slug]/page.tsx`                                  | Modifier (ISR + safeJsonLd + by-key notFound) | `app/vente-moto/[id]/page.tsx`                               |
| `app/sitemap.ts`                                                         | Modifier (adapter actifs)                     | —                                                            |
| `components/cart/CartProvider.tsx`                                       | Modifier (rehydrate drop deleted)             | —                                                            |
| `next.config.js`                                                         | Modifier (CSP nonce + allowedOrigins)         | —                                                            |
| `middleware.ts`                                                          | Modifier (génère nonce)                       | —                                                            |
| `scripts/seed-firestore.ts`                                              | Modifier (products +champs)                   | bloc products existant                                       |
| `tests/unit/schemas/product.test.ts`                                     | Créer                                         | `tests/unit/schemas/moto.test.ts`                            |
| `tests/unit/admin-products-actions.test.ts`                              | Créer                                         | `tests/unit/admin-motos-actions.test.ts`                     |
| `tests/unit/components/admin/ProductForm.test.tsx`                       | Créer                                         | `tests/unit/components/admin/MotoForm.test.tsx`              |
| `tests/unit/components/admin/CompatibilityFields.test.tsx`               | Créer                                         | —                                                            |
| `tests/unit/data-adapter.test.ts`                                        | Modifier (régression deletedAt)               | —                                                            |
| `tests/e2e/catalogue-public.spec.ts`                                     | Créer                                         | `tests/e2e/vente-moto-public.spec.ts`                        |
| `tests/e2e/admin-products.spec.ts`                                       | Créer                                         | `tests/e2e/admin-motos.spec.ts` + `admin.spec.ts` (auth #23) |

---

## Task 1 : `Product.updatedAt` + `deletedAt` + fixtures

**Satisfait :** §2 modèle, leçon 6. **Files:** Modify `lib/types.ts`, `lib/products.ts` ; Test `tests/unit/data-adapter.test.ts`.

- [ ] **Step 1:** Dans `tests/unit/data-adapter.test.ts`, `describe` StaticAdapter, ajouter :

```typescript
it('chaque produit statique a updatedAt ISO + deletedAt null (régression P5)', async () => {
  const products = await adapter.getProducts();
  for (const p of products) {
    expect(typeof p.updatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(p.updatedAt))).toBe(false);
    expect(p.deletedAt).toBeNull();
  }
});
```

- [ ] **Step 2:** Run `npx vitest run tests/unit/data-adapter.test.ts -t "régression P5"` → FAIL (`undefined`). Si autre raison, STOP.
- [ ] **Step 3:** `lib/types.ts` interface `Product`, après `createdAt: string;` ajouter :

```typescript
updatedAt: string; // ISO — optimistic lock + tri admin (Phase 5)
deletedAt: string | null; // ISO si soft-deleted, null si actif — TOUJOURS présent (Phase 5)
```

- [ ] **Step 4:** `lib/products.ts` : ajouter à CHAQUE fixture `PRODUCTS` (après `createdAt`) `updatedAt` (dates ISO distinctes croissantes, réutiliser/incrémenter le pattern de dates de `createdAt`) et `deletedAt: null`. Aucune fixture supprimée.
- [ ] **Step 5:** Run `npx vitest run tests/unit/data-adapter.test.ts` → PASS. `npx tsc --noEmit` → 0 err (corriger toute construction `Product` littérale cassée — ex. mocks/tests existants — en ajoutant `updatedAt`/`deletedAt`).
- [ ] **Step 6:** Commit `git add lib/types.ts lib/products.ts tests/unit/data-adapter.test.ts && git commit -m "feat(products): updatedAt + deletedAt sur Product + fixtures (Phase 5)"`

---

## Task 2 : Schémas `ProductWriteSchema` (.strict) + `ProductSchema` + bornes

**Satisfait :** §9.4,5,6,8,9,10,12 + §2. **Files:** Modify `lib/schemas/product.ts` ; Test `tests/unit/schemas/product.test.ts`.

- [ ] **Step 1:** Lire `lib/schemas/product.ts` (existant) + `lib/schemas/moto.ts` (template structure). Créer `tests/unit/schemas/product.test.ts` avec ces cas (écrire AVANT impl) :

```typescript
import { describe, it, expect } from 'vitest';
import { ProductWriteSchema, ProductSchema, COMPAT_MAX } from '@/lib/schemas/product';

const validWrite = {
  name: 'Plaquettes avant',
  reference: 'REN-CLO4-DBF-001',
  description: 'desc',
  shortDescription: 'court',
  price: 6500,
  priceOriginal: 8000,
  images: ['https://firebasestorage.googleapis.com/x.webp'],
  category: 'freinage',
  vehicleType: 'auto',
  compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }],
  stock: 12,
  isPromoted: false,
};

it('accepte un write valide', () => {
  expect(ProductWriteSchema.safeParse(validWrite).success).toBe(true);
});
it('REJETTE une clé inconnue (anti-mass-assignment)', () => {
  expect(ProductWriteSchema.safeParse({ ...validWrite, hacked: 1 }).success).toBe(false);
});
it('REJETTE les champs server-only injectés', () => {
  for (const k of ['id', 'slug', 'createdAt', 'updatedAt', 'deletedAt']) {
    expect(ProductWriteSchema.safeParse({ ...validWrite, [k]: 'x' }).success).toBe(false);
  }
});
it('price: rejette négatif, non-entier, > cap 1M€', () => {
  expect(ProductWriteSchema.safeParse({ ...validWrite, price: -1 }).success).toBe(false);
  expect(ProductWriteSchema.safeParse({ ...validWrite, price: 19.99 }).success).toBe(false);
  expect(ProductWriteSchema.safeParse({ ...validWrite, price: 100_000_01 }).success).toBe(false);
});
it('strings: rejette au-dessus des caps', () => {
  expect(ProductWriteSchema.safeParse({ ...validWrite, name: 'a'.repeat(201) }).success).toBe(
    false
  );
  expect(
    ProductWriteSchema.safeParse({ ...validWrite, description: 'a'.repeat(5001) }).success
  ).toBe(false);
});
it('images: rejette non-url, host hors allowlist, > 8', () => {
  expect(
    ProductWriteSchema.safeParse({ ...validWrite, images: ['javascript:alert(1)'] }).success
  ).toBe(false);
  expect(ProductWriteSchema.safeParse({ ...validWrite, images: ['http://evil/x'] }).success).toBe(
    false
  );
  expect(
    ProductWriteSchema.safeParse({
      ...validWrite,
      images: Array(9).fill('https://firebasestorage.googleapis.com/x'),
    }).success
  ).toBe(false);
});
it('compatibility: rejette > COMPAT_MAX et yearTo<yearFrom', () => {
  expect(COMPAT_MAX).toBe(50);
  const big = Array(51).fill({ brand: 'B', model: 'M', yearFrom: 2010 });
  expect(ProductWriteSchema.safeParse({ ...validWrite, compatibility: big }).success).toBe(false);
  expect(
    ProductWriteSchema.safeParse({
      ...validWrite,
      compatibility: [{ brand: 'B', model: 'M', yearFrom: 2020, yearTo: 2010 }],
    }).success
  ).toBe(false);
});
it('ProductSchema (read) accepte un doc complet avec updatedAt+deletedAt', () => {
  expect(
    ProductSchema.safeParse({
      ...validWrite,
      id: 'p1',
      slug: 'plaquettes',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      deletedAt: null,
    }).success
  ).toBe(true);
});
```

- [ ] **Step 2:** Run `npx vitest run tests/unit/schemas/product.test.ts` → FAIL (exports manquants).
- [ ] **Step 3:** Réécrire `lib/schemas/product.ts` :

```typescript
import { z } from 'zod';
import type { Product } from '@/lib/types';

export const COMPAT_MAX = 50;
const currentYear = new Date().getFullYear();
const PRICE_CAP = 100_000_000; // 1 000 000,00 € en centimes
const IMAGE_HOST_ALLOW = ['firebasestorage.googleapis.com'];

const httpsAllowedHost = z
  .string()
  .url()
  .refine((u) => {
    try {
      return IMAGE_HOST_ALLOW.includes(new URL(u).host);
    } catch {
      return false;
    }
  }, 'host image non autorisé');

const compatibilitySchema = z
  .object({
    brand: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    yearFrom: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 2),
    yearTo: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 2)
      .optional(),
  })
  .refine((c) => c.yearTo === undefined || c.yearTo >= c.yearFrom, 'yearTo < yearFrom');

const baseShape = {
  name: z.string().min(1).max(200),
  reference: z.string().min(1).max(100),
  description: z.string().min(1).max(5000),
  shortDescription: z.string().min(1).max(300),
  price: z.number().int().min(0).max(PRICE_CAP),
  priceOriginal: z.number().int().min(0).max(PRICE_CAP).optional(),
  images: z.array(httpsAllowedHost).min(1).max(8),
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
  compatibility: z.array(compatibilitySchema).max(COMPAT_MAX),
  stock: z.number().int().min(0),
  isPromoted: z.boolean(),
};

// WRITE: strict → rejette toute clé inconnue ET tout champ server-only (absents du shape)
export const ProductWriteSchema = z.object(baseShape).strict();

// READ: doc Firestore complet (champs server-side inclus)
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ProductSchema = z.object({
  ...baseShape,
  id: z.string().min(1).max(80).regex(SLUG_RE),
  slug: z.string().min(1).max(80).regex(SLUG_RE),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export function parseProduct(data: unknown): Product {
  return ProductSchema.parse(data) as Product;
}
```

- [ ] **Step 4:** Run `npx vitest run tests/unit/schemas/product.test.ts` → PASS (tous). `npx tsc --noEmit` → 0 err. Si `parseProduct` exige un cast au-delà de celui montré, c'est une divergence `Product`↔`ProductSchema` réelle : aligner le schéma, PAS ajouter de cast supplémentaire.
- [ ] **Step 5:** Commit `git add lib/schemas/product.ts tests/unit/schemas/product.test.ts && git commit -m "feat(products): ProductWriteSchema strict + bornes + ProductSchema read (Phase 5 hardening §9.4-12)"`

---

## Task 3 : Adapter — exclusion `deletedAt` query-level + by-key

**Satisfait :** §9.16,17 + §3,4. **Files:** Modify `lib/data/types.ts`, `lib/data/static.ts`, `lib/data/firebase.ts` ; Test `tests/unit/data-adapter.test.ts`.

- [ ] **Step 1:** Tests (écrire avant) dans `tests/unit/data-adapter.test.ts` :

```typescript
it('getProducts exclut deletedAt par défaut, includeDeleted le rend', async () => {
  const all = await adapter.getProducts({ includeDeleted: true });
  const target = all[0];
  // simuler suppression via l'API de test du StaticAdapter (cf. pattern motos vendu)
  // -> ce test pilote l'impl: getProducts() sans flag ne doit jamais renvoyer un deletedAt!=null
  const active = await adapter.getProducts();
  expect(active.every((p) => p.deletedAt === null)).toBe(true);
});
it('getProductBySlug/ById renvoie null pour un produit soft-deleted (sauf includeDeleted)', async () => {
  // pose deletedAt sur un doc via le helper de test, puis:
  // expect(await adapter.getProductBySlug(slug)).toBeNull();
  // expect(await adapter.getProductBySlug(slug, { includeDeleted: true })).not.toBeNull();
});
```

> Adapter le helper de mutation de test au pattern existant du StaticAdapter (regarder comment les tests motos/véhicules simulent un changement d'état ; si le StaticAdapter lit `PRODUCTS` immuable, injecter un produit `deletedAt` via le même mécanisme que les tests adapter existants — sinon, tester firebase.ts via mock Firestore comme les tests adapter firebase existants).

- [ ] **Step 2:** Run → FAIL. **Step 3:** Impl :
  - `lib/data/types.ts` : `interface ProductFilters { ...; includeDeleted?: boolean }`. Signatures `getProductBySlug(slug, opts?: { includeDeleted?: boolean })`, `getProductById(id, opts?)`.
  - `lib/data/static.ts` : `getProducts` filtre `!filters?.includeDeleted ? list.filter(p => p.deletedAt === null) : list`. `getProductBySlug/ById` : `if (found?.deletedAt && !opts?.includeDeleted) return null;`. `getProductsByCategory`/promoted/featured : même exclusion.
  - `lib/data/firebase.ts` : lectures de liste → ajouter `.where('deletedAt','==', null)` à la query Firestore quand `!includeDeleted` (PAS de filtre post-fetch). `getProductBySlug/ById` (fetch by key) : après `parseProduct`, `if (doc.deletedAt && !opts?.includeDeleted) return null;`.
- [ ] **Step 4:** Run `npx vitest run tests/unit/data-adapter.test.ts` → PASS. `npx tsc --noEmit` → 0 err (mettre à jour tous les call-sites `getProductBySlug/ById` si signature élargie — vérifier `grep -rn "getProductBySlug\|getProductById" app lib`).
- [ ] **Step 5:** Commit `git add lib/data/types.ts lib/data/static.ts lib/data/firebase.ts tests/unit/data-adapter.test.ts && git commit -m "feat(products): exclusion deletedAt query-level + by-key (Phase 5 §9.16-17)"`

---

## Task 4 : `firestore.rules` — read produits `deletedAt`

**Satisfait :** §9.18. **Files:** Modify `firestore.rules` ; Test (émulateur rules si harnais présent, sinon revue + commentaire).

- [ ] **Step 1:** Lire le bloc `match /products/{doc=**}` dans `firestore.rules` (actuellement `allow read; allow write: if isAdmin();`).
- [ ] **Step 2:** Remplacer la ligne read par :

```
      allow read: if resource.data.deletedAt == null || isAdmin();
      allow write: if isAdmin();
```

> Note : les fixtures/seed écrivent toujours `deletedAt` (Task 1/12) donc `resource.data.deletedAt` existe toujours — pas de cas champ-absent.

- [ ] **Step 3:** Si `tests/` contient un harnais rules emulator (`grep -rln "@firebase/rules-unit-testing" tests`), ajouter un test : anon `get(products/<deleted>)` → denied, anon `get(products/<actif>)` → allowed, admin → allowed. Sinon : vérifier syntaxe via `npx firebase deploy --only firestore:rules --dry-run` (ou `firebase emulators:exec`), documenter dans le commit l'absence de harnais rules.
- [ ] **Step 4:** Commit `git add firestore.rules <test si créé> && git commit -m "feat(security): firestore.rules products read exclut deletedAt sauf admin (Phase 5 §9.18)"`

---

## Task 5 : Server Actions `app/admin/products/actions.ts`

**Satisfait :** §9.1,2,3,5,9,11,24,25,26 + §5. **Files:** Create `app/admin/products/actions.ts` ; Test `tests/unit/admin-products-actions.test.ts`.

- [ ] **Step 1:** Lire ENTIER `app/admin/motos/actions.ts` (template : requireAdmin, parseForm explicite, transaction optimistic-lock, FormActionState, soft-delete, writeAuditLog, revalidateTag). Lire `lib/admin/audit.ts` (signature `writeAuditLog`) + `lib/admin/auth.ts` (`requireAdmin`/`AdminError`). Créer `tests/unit/admin-products-actions.test.ts` : copie adaptée de `tests/unit/admin-motos-actions.test.ts` avec ces cas (mêmes mocks que le test motos) :
  - create ok / zod-invalid / non-admin (401, 0 write)
  - update concordant / conflit optimistic-lock (`{errors:{_form}}`, 0 write, **pas d'audit**)
  - **`deleteProduct` prend le lock** : delete avec `updatedAt` périmé → conflit, pas de soft-delete appliqué
  - delete soft : set `deletedAt` ISO, `disponibilite` n'existe pas → ne pas y toucher
  - `restoreProduct` : remet `deletedAt: null`
  - **mass-assignment** : formData avec `deletedAt`/`updatedAt`/`id` → ignorés (valeur server-side gagne ; `updateProduct` ne peut pas set `deletedAt`)
  - **compat sparse-injection** : formData `compat_0_*` + `compat_99999_*` → exactement 1 entrée
  - **audit denied** : action sans session → `requireAdmin` throw → un enregistrement audit `action:'denied'` émis avant rethrow
  - caracteristiques/champs vides → pas d'`undefined` envoyé à Firestore
- [ ] **Step 2:** Run → FAIL (module introuvable).
- [ ] **Step 3:** Créer `app/admin/products/actions.ts`, miroir de `motos/actions.ts` avec deltas :
  - `requireAdmin()` 1ère instruction de `createProduct`/`updateProduct`/`deleteProduct`/`restoreProduct`. Wrapper : `try { session = await requireAdmin(); } catch (e) { await writeAuditLog({ action:'denied', resourceType:'product', actorUid: null, ... }).catch(()=>{}); throw e; }` (log denied best-effort, **avant** rethrow ; ne pas masquer un échec d'audit pour les mutations réussies — log stderr si `writeAuditLog` throw).
  - `parseForm` : liste explicite UNIQUEMENT des champs de `baseShape` (name, reference, description, shortDescription, price, priceOriginal, images, category, vehicleType, compatibility, stock, isPromoted). **Ne JAMAIS lire `id`/`slug`/`createdAt`/`updatedAt`/`deletedAt` depuis formData.** `slug` = dérivé server-side du `name` (slugify) OU champ validé séparément par `ProductSchema.shape.slug` puis unicité (Step transaction). Prix : `const cents = Math.round(Number(euros) * 100); if (!Number.isInteger(cents) || cents < 0) → erreur`. Rejet `Number.isNaN`/`!Number.isFinite`.
  - **Reconstruction `compatibility` dense bornée** :

```typescript
const compatibility = [];
for (let i = 0; i < 50; i++) {
  const brand = sanitize(formData.get(`compat_${i}_brand`));
  if (!brand) break; // dense: stop au premier trou, ignore indices supérieurs
  compatibility.push({
    brand,
    model: sanitize(formData.get(`compat_${i}_model`)),
    yearFrom: Number(formData.get(`compat_${i}_yearFrom`)),
    ...(formData.get(`compat_${i}_yearTo`)
      ? { yearTo: Number(formData.get(`compat_${i}_yearTo`)) }
      : {}),
  });
}
```

- Validation via `ProductWriteSchema.safeParse(parsed)` → si `!success` `{ errors: fieldErrors }`. Unicité slug dans la transaction (query `where('slug','==',slug)`, conflit si id différent → `{errors:{_form:['Slug déjà utilisé']}}`).
- `createProduct` : set `createdAt`/`updatedAt = now`, `deletedAt: null`. `updateProduct` : optimistic lock sur `updatedAt` (transaction lit `before.updatedAt !== clientUpdatedAt` → conflit), set `updatedAt = now`. `deleteProduct` : **même transaction lock**, set `deletedAt = now ISO`. `restoreProduct` : lock, set `deletedAt: null`.
- `writeAuditLog` POST-commit `resourceType:'product'`, `action:'create'|'update'|'delete'|'restore'`. `revalidateTag('products')` + `revalidatePath('/pieces/' + slug)` + revalidation sitemap (`revalidatePath('/sitemap.xml')` ou tag dédié) après commit.
- [ ] **Step 4:** Run `npx vitest run tests/unit/admin-products-actions.test.ts` → PASS (tous). `npx tsc --noEmit` → 0 err.
- [ ] **Step 5:** Commit `git add app/admin/products/actions.ts tests/unit/admin-products-actions.test.ts && git commit -m "feat(admin-products): Server Actions CRUD+restore, lock incl. delete, audit denied (Phase 5 §9.1-26)"`

---

## Task 6 : `CompatibilityFields.tsx` (sous-form répétable borné)

**Satisfait :** §6, §9.11. **Files:** Create `components/admin/CompatibilityFields.tsx` ; Test `tests/unit/components/admin/CompatibilityFields.test.tsx`.

- [ ] **Step 1:** Test RTL (écrire avant) :

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CompatibilityFields } from '@/components/admin/CompatibilityFields';

it('rend 1 ligne vide par défaut, ajoute/supprime, names indexés denses, cap 50', () => {
  render(<CompatibilityFields initial={[]} />);
  fireEvent.click(screen.getByRole('button', { name: /ajouter compatibilité/i }));
  expect(screen.getAllByPlaceholderText(/marque/i).length).toBe(2);
  // names compat_0_brand, compat_1_brand présents
  expect(document.querySelector('input[name="compat_1_brand"]')).toBeTruthy();
  fireEvent.click(screen.getAllByRole('button', { name: /supprimer/i })[0]);
  expect(document.querySelector('input[name="compat_1_brand"]')).toBeFalsy(); // re-densifié
});
it('initial pré-remplit les lignes', () => {
  render(
    <CompatibilityFields
      initial={[{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }]}
    />
  );
  expect((document.querySelector('input[name="compat_0_brand"]') as HTMLInputElement).value).toBe(
    'Renault'
  );
});
```

- [ ] **Step 2:** Run → FAIL. **Step 3:** Impl `components/admin/CompatibilityFields.tsx` : `'use client'`, props `{ initial: VehicleCompatibility[] }`, état `rows: VehicleCompatibility[]` (au moins 1 ligne vide si `initial` vide). Bouton « + Ajouter compatibilité » (désactivé si `rows.length >= 50`). Chaque ligne : 4 inputs `name="compat_{idx}_brand|model|yearFrom|yearTo"` (idx = index courant du tableau, donc TOUJOURS dense après suppression — re-render réindexe), placeholders Marque/Modèle/Année début/Année fin, bouton « Supprimer » par ligne. `grid grid-cols-1 sm:grid-cols-4 gap-2`. Tokens iOS Clarity comme `MotoForm`.
- [ ] **Step 4:** Run `npx vitest run tests/unit/components/admin/CompatibilityFields.test.tsx` → PASS. `npx tsc --noEmit` → 0 err.
- [ ] **Step 5:** Commit `git add components/admin/CompatibilityFields.tsx tests/unit/components/admin/CompatibilityFields.test.tsx && git commit -m "feat(admin-products): CompatibilityFields répétable dense borné 50 (Phase 5 §6)"`

---

## Task 7 : `ProductForm.tsx` (+ coverage gate dès maintenant)

**Satisfait :** §6, §9.15, leçon 5. **Files:** Create `components/admin/ProductForm.tsx` ; Test `tests/unit/components/admin/ProductForm.test.tsx`.

- [ ] **Step 1:** Lire ENTIER `components/admin/MotoForm.tsx` (template) + `tests/unit/components/admin/MotoForm.test.tsx` (template test, mocks `useActionState`/`useFormStatus`/`next/navigation`/Toast/ImageUploader). Créer `tests/unit/components/admin/ProductForm.test.tsx` : copie adaptée, champs Product (name, reference, slug?, description, shortDescription, prix €, priceOriginal, category select 8 options, vehicleType select auto/moto, stock number, isPromoted checkbox, ImageUploader folder=products) + `<CompatibilityFields>` rendu. Cas : rend create (defaults), rend edit (pré-rempli depuis `initial` `PRODUCTS[0]`), bouton submit 'Créer le produit' vs 'Enregistrer', compat add/remove fonctionne dans le form. (Mocker `@/components/admin/CompatibilityFields` n'est PAS souhaité ici — le rendre réellement pour la coverage.)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Créer `components/admin/ProductForm.tsx`, miroir `MotoForm.tsx` : import `Product`, actions `createProduct`/`updateProduct` (`@/app/admin/products/actions`), `onSuccess` → `/admin/products`, `<ImageUploader folder="products">`, champs ci-dessus, `<CompatibilityFields initial={initial?.compatibility ?? []} />` dans un fieldset « Compatibilité ». `name=` des inputs scalaires == liste lue par `parseForm` Task 5. `<FieldError>` sur les champs top-level comme le template. Prix affiché en € (diviser centimes /100 en edit, le form soumet €, l'action `Math.round(*100)`).
- [ ] **Step 4:** Run `npx vitest run tests/unit/components/admin/ProductForm.test.tsx` → PASS. `npx tsc --noEmit` → 0 err. `npm run build` → succès.
- [ ] **Step 5:** **Vérif coverage immédiate (leçon 4b)** : `npx vitest run --coverage` → lines≥55/fn≥55/br≥50, 0 failed. Si sous le seuil, étendre les tests ProductForm/CompatibilityFields (assertions réelles, pas padding) jusqu'à passage.
- [ ] **Step 6:** Commit `git add components/admin/ProductForm.tsx tests/unit/components/admin/ProductForm.test.tsx && git commit -m "feat(admin-products): ProductForm + CompatibilityFields + coverage RTL (Phase 5)"`

---

## Task 8 : Pages admin produits

**Satisfait :** §7. **Files:** Create `app/admin/(shell)/products/{page.tsx,ProductsTable.tsx,new/page.tsx,[id]/page.tsx}`.

- [ ] **Step 1:** Lire les 4 templates `app/admin/(shell)/motos/{page.tsx,MotosTable.tsx,new/page.tsx,[id]/page.tsx}`. Créer les 4 équivalents produits : `vehicule/moto`→`product`, `getMotos`→`getProducts({ includeDeleted: true })` (admin voit les supprimés), `MotoForm`→`ProductForm`, heading "Produits", liens `/admin/products*`. `ProductsTable.tsx` = client wrapper (DataTable **avec search** — ~40 produits). Colonnes : name+reference, catégorie, prix FR € (`(p.price/100).toLocaleString('fr-FR')` €), stock (badge `<5` bas / `0` rupture), StatusBadge actif/supprimé (`p.deletedAt ? 'Supprimé' : 'Actif'`), lien Éditer. Dans `[id]/page.tsx` : `getProductById(id, { includeDeleted: true })`, conserver le commentaire dette fetch-all+find si présent dans le template, bouton « Restaurer » (action `restoreProduct`) visible si `product.deletedAt`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0 err. `rm -rf .next && npm run build` → succès, routes `/admin/products`, `/admin/products/new`, `/admin/products/[id]` présentes (coller les lignes).
- [ ] **Step 3:** Commit `git add "app/admin/(shell)/products" && git commit -m "feat(admin-products): pages liste / new / edit + restore (Phase 5 §7)"`

---

## Task 9 : products-cache + rewire public `/pieces` (liste + détail) ISR + safeJsonLd

**Satisfait :** §4, §9.13,21,22,23. **Files:** Create `lib/data/products-cache.ts` ; Modify `app/(boutique)/pieces/CatalogueClient.tsx`, la page liste `app/(boutique)/pieces/page.tsx`, `app/(boutique)/pieces/[slug]/page.tsx`.

- [ ] **Step 1:** Créer `lib/data/products-cache.ts` (miroir `motos-cache.ts`) :

```typescript
import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { Product } from '@/lib/types';

export const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const adapter = await getAdapter();
    return adapter.getProducts(); // actifs only (filtre adapter Task 3)
  },
  ['products-public'],
  { tags: ['products'] }
);
```

- [ ] **Step 2:** Lire `app/vente-moto/page.tsx` + `[id]/page.tsx` + `VenteMotoClient.tsx` (templates ISR post-4b) ET les fichiers `app/(boutique)/pieces/*` actuels. Appliquer :
  - Page liste `pieces` : async, `await getCachedProducts()`, passe `products` en prop à `<CatalogueClient>`, `export const revalidate = 3600`. Vérifier pas de `export const dynamic` en conflit.
  - `CatalogueClient.tsx` : retirer `import { PRODUCTS } from '@/lib/products'` → prop `{ products }: { products: Product[] }`, usages `PRODUCTS`→`products`, ajouter `products` aux deps useMemo. Filtres UI inchangés.
  - `pieces/[slug]/page.tsx` : `generateStaticParams` via `await import('@/lib/data')` → `getProducts()` (actifs, PAS getCached) ; `generateMetadata` + Page via `getCachedProducts()` + find par slug ; `notFound()` si introuvable OU `deletedAt` (by-key adapter renvoie déjà null) ; `export const revalidate = 3600` ; **JSON-LD via `safeJsonLd` (import `@/lib/safe-json-ld`)** au lieu de `JSON.stringify` (§9.13) ; commentaire défensif notFound ISR.
- [ ] **Step 3:** `npx tsc --noEmit` → 0 err. `rm -rf .next && npm run build` → succès, route `/pieces/[slug]` SSG présente.
- [ ] **Step 4:** Vérif empirique (prouver) : `.env.local` force FirebaseAdapter — `ls -la .env.local` ; si présent `mv .env.local .env.local.bak` ; build ; `PORT=3200 npx next start &` (PID) ; curl quelques slugs produits réels → 200 ; `curl :3200/pieces | grep -c '/pieces/'` (HTML minifié = 1 ligne, vérifier slugs via `grep -o`) ; tuer serveur ; **restaurer `mv .env.local.bak .env.local` + `ls -la` sans faute** même si échec.
- [ ] **Step 5:** Commit `git add lib/data/products-cache.ts "app/(boutique)/pieces" && git commit -m "feat(products): /pieces liste+détail SSG→ISR + safeJsonLd (Phase 5 §4 §9.13-23)"`

---

## Task 10 : Migrer importeurs statiques `PRODUCTS` (sitemap + CartProvider)

**Satisfait :** §9.19,20, §4. **Files:** Modify `app/sitemap.ts`, `components/cart/CartProvider.tsx` ; Test (E2E couvre la fuite ; ici unit/intégration ciblé).

- [ ] **Step 1:** `grep -rn "from '@/lib/products'" app components lib | grep -v test` → confirmer la liste résiduelle (attendu : `sitemap.ts`, `CartProvider.tsx` ; tout autre = à traiter aussi).
- [ ] **Step 2:** `app/sitemap.ts` : remplacer `import { PRODUCTS }` par lecture adapter directe actifs (`const { getAdapter } = await import('@/lib/data'); const products = await (await getAdapter()).getProducts();` — `getProducts()` exclut déjà `deletedAt`). Sitemap = fonction async si besoin.
- [ ] **Step 3:** `components/cart/CartProvider.tsx` (client) : `rehydrateItems` ne doit plus lire `PRODUCTS` statique. Pattern : la source produits live arrive via un boundary server (prop/contexte depuis un Server Component qui appelle `getCachedProducts()`), OU le panier valide chaque item au rehydrate contre une route/server-action qui renvoie les produits actifs. **Règle (§9.20)** : un item dont le productId est introuvable OU `deletedAt!=null` OU `stock===0` est DROP du panier au rehydrate (pas de prix/nom ressuscité depuis localStorage). Implémenter le boundary minimal (ne pas sur-architecturer) : si un Server Component parent peut injecter `activeProducts`, l'utiliser ; sinon une server action `getActiveProductsForCart()` lue au mount. Documenter le choix dans le commit.
- [ ] **Step 4:** Test ciblé : unit `CartProvider` — rehydrate avec un productId absent/deleted/stock0 → item retiré (mock la source produits). `npx tsc --noEmit` 0 err, `npm run build` succès, `npx vitest run --coverage` 0 failed + seuils.
- [ ] **Step 5:** Commit `git add app/sitemap.ts components/cart/CartProvider.tsx <tests> && git commit -m "feat(products): migre sitemap+cart vers adapter actifs, drop item supprimé (Phase 5 §9.19-20)"`

---

## Task 11 : CSP nonce (retrait `'unsafe-inline'` script-src)

**Satisfait :** §9.14. **Files:** Modify `next.config.js`, `middleware.ts` ; Test E2E (Task 14) + vérif header.

- [ ] **Step 1:** Lire `next.config.js` (header CSP) + `middleware.ts`. Stratégie Next 15 : générer un `nonce` par requête dans `middleware.ts` (`crypto.randomUUID()`/base64), le passer via header `x-nonce` + l'injecter dans le CSP `script-src 'self' 'nonce-<n>' 'strict-dynamic'` (retirer `'unsafe-inline'` de script-src ; `style-src` peut garder `'unsafe-inline'` — hors scope). Lire la doc Next 15 CSP nonce (context7 `/vercel/next.js` si besoin) pour le wiring exact App Router (le nonce doit atteindre les `<script>` framework — Next le propage si le header `x-nonce` est posé en middleware et lu via `headers()`).
- [ ] **Step 2:** Implémenter : middleware pose `x-nonce` + construit le CSP dynamique (déplacer le CSP de `next.config.js` headers() vers le middleware si nécessaire pour le rendre par-requête ; garder les autres headers sécurité). JSON-LD : `<script type="application/ld+json" nonce={nonce}>` (récupérer nonce via `headers()` dans les Server Components `pieces/[slug]`, `vente-moto/[id]`, `vente-vehicule/[id]` — ces 2 derniers déjà `safeJsonLd` depuis P0, ajouter le nonce).
- [ ] **Step 3:** `npm run build` succès. `PORT=3201 npx next start &` ; `curl -sI :3201/pieces | grep -i content-security` → `script-src` contient `'nonce-` et **PAS** `'unsafe-inline'`. Charger une page, vérifier aucune erreur CSP console (script framework + JSON-LD ont le nonce). Tuer serveur.
- [ ] **Step 4:** `npx tsc --noEmit` 0 err. Commit `git add next.config.js middleware.ts app/**/page.tsx && git commit -m "feat(security): CSP nonce, retrait unsafe-inline script-src (Phase 5 §9.14)"`

> Si le wiring nonce Next 15 s'avère incompatible avec un `<script>` tiers requis (analytics, etc.), STOP et reporter — ne pas réintroduire `'unsafe-inline'` silencieusement ; documenter le blocage pour décision.

---

## Task 12 : Seed produits — champs `updatedAt`/`deletedAt`

**Satisfait :** §2, leçon 7. **Files:** Modify `scripts/seed-firestore.ts`.

- [ ] **Step 1:** Lire le bloc `products` de `scripts/seed-firestore.ts` (existe : `clearCollection('products')` + `parseProduct` + batch). Le seed importe `PRODUCTS` (qui a maintenant `updatedAt`/`deletedAt:null` depuis Task 1) et `parseProduct` valide via `ProductSchema` (qui inclut maintenant ces champs depuis Task 2) → vérifier que le seed passe sans modif de logique. Si `parseProduct` rejette (champs requis), ajuster le bloc pour inclure `updatedAt`/`deletedAt` (déjà dans les fixtures). `meta/admins` : NE PAS retoucher (déjà ajouté #23, gardé par le guard `FIRESTORE_EMULATOR_HOST`).
- [ ] **Step 2:** `npx tsc --noEmit` 0 err. Test émulateur : `npx firebase emulators:start --only firestore --project demo-gp-parts &` ; `sleep 8` ; `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-firestore.ts` → produits + véhicules + motos sans erreur ; vérifier `products count` inchangé, chaque doc a `deletedAt: null`. Tuer émulateur.
- [ ] **Step 3:** Commit `git add scripts/seed-firestore.ts && git commit -m "feat(products): seed produits avec updatedAt/deletedAt (Phase 5)"`

---

## Task 13 : `serverActions.allowedOrigins`

**Satisfait :** §9.28. **Files:** Modify `next.config.js`.

- [ ] **Step 1:** Lire `next.config.js`. Ajouter `experimental: { serverActions: { allowedOrigins: ['gp-parts.vercel.app', '*.vercel.app'] } }` (fusionner avec `experimental` existant si présent ; inclure le domaine prod réel — vérifier l'URL prod dans le repo/README, ne pas inventer).
- [ ] **Step 2:** `npx tsc --noEmit` 0 err, `npm run build` succès. Commit `git add next.config.js && git commit -m "feat(security): serverActions.allowedOrigins defense-in-depth (Phase 5 §9.28)"`

---

## Task 14 : E2E produits (public + admin)

**Satisfait :** §8, §9.16-20 (anti-régression fuite). **Files:** Create `tests/e2e/catalogue-public.spec.ts`, `tests/e2e/admin-products.spec.ts`.

- [ ] **Step 1:** Lire `tests/e2e/vente-moto-public.spec.ts` (template public) + `tests/e2e/admin-motos.spec.ts` + `tests/e2e/admin.spec.ts` (pattern auth #23 : `loginViaEmulator` réel + seed `meta/admins` via Admin SDK déjà dans seed-firestore — réutiliser EXACTEMENT, pas de REST PATCH non-auth). Créer :
  - `catalogue-public.spec.ts` : `/pieces` rend ≥1 produit (`a[href^="/pieces/"]` visible), une fiche `/pieces/<slug>` rend (h1 visible) ; **anti-fuite** : (si harnais émulateur dispo) soft-delete un produit via une action/route admin authentifiée puis vérifier absent de la liste, `/pieces/<slug>` → 404, absent de `/sitemap.xml` ; sinon assertion statique catalogue non-vide + commenter la limite.
  - `admin-products.spec.ts` : pattern auth de `admin.spec.ts` (#23) ; `/admin/products` heading "Produits" + lien Nouveau ; `/admin/products/new` form (getByLabel champs réels du `ProductForm` — vérifier labels exacts) ; édition d'un produit seedé pré-remplit (getByLabel name/prix). Gating identique aux specs admin existantes.
- [ ] **Step 2:** `npx tsc --noEmit` 0 err. `npx playwright test tests/e2e/catalogue-public.spec.ts tests/e2e/admin-products.spec.ts --list` → collectés. Si exécutable en mode CI-équivalent local (prod build + émulateurs + seed, comme la résolution #23), lancer et viser vert ; sinon documenter et s'appuyer sur la CI (mais avoir reproduit localement le mode CI au moins une fois — leçon #23, fini le push-and-pray).
- [ ] **Step 3:** Commit `git add tests/e2e/catalogue-public.spec.ts tests/e2e/admin-products.spec.ts && git commit -m "test(products): E2E catalogue public + admin (Phase 5 §8)"`

---

## Task 15 : Audit qualité + PR + CI verte

**Satisfait :** clôture.

- [ ] **Step 1:** `npx tsc --noEmit` (0 err) · `npm run lint` (0 warn) · `npx prettier --check $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx)$' | tr '\n' ' ')` (clean) · `npx vitest run --coverage` (**avec --coverage** — 0 régression, seuils lines≥55/fn≥55/br≥50 ; baseline + nouveaux tests Phase 5) · `rm -rf .next && npm run build` (succès).
- [ ] **Step 2:** Corriger toute régression AVANT push (impact-map manqué = réparer pas désactiver ; ne jamais `--no-verify`). Reproduire le mode CI-équivalent localement pour l'E2E avant push (leçon #23).
- [ ] **Step 3:** `git push -u origin feat/admin-cms-phase5-produits` + `gh pr create --repo Nostaflex/gp-parts --base main` titre `feat(admin-cms): Phase 5 — CRUD produits (durci sécurité)` ; body : résumé, lien spec, les 28 exigences couvertes (cocher), deltas Product, vérif empirique, threat model résumé, « Différé : aucun (CSP nonce inclus) ». Finir le body par : 🤖 Generated with [Claude Code](https://claude.com/claude-code)
- [ ] **Step 4:** Attendre CI verte (job principal + E2E) — règle d'or. NE PAS merger (décision humaine).

---

## Self-Review (couverture spec)

- **§1 décisions** : Task 3/4/9/10 (decision 4 → 4 couches), Task 2 (decision 2 server-only), Task 6 (decision 3 borné), Task 9/10 (decision 1 rewire). ✅
- **§2 modèle** : Task 1 (`updatedAt`/`deletedAt` toujours présent + fixtures), Task 2 (schémas). ✅
- **§3 adapter/cache** : Task 3 (filters), Task 9 (cache). ✅
- **§4 4 couches** : Task 3 (query+by-key), Task 4 (rules), Task 9 (invalidation), Task 10 (consumers). ✅
- **§5 CRUD** : Task 5. **§6 ProductForm/compat** : Task 6+7. **§7 pages** : Task 8. **§8 tests** : Task 2/5/6/7/14 + régression Task 3. ✅
- **§9 28 exigences** : 1-3→T5 ; 4-12→T2 ; 13,21,22,23→T9 ; 14→T11 ; 15→T7 ; 16,17→T3 ; 18→T4 ; 19,20→T10 ; 24,25,26→T5 ; 27→décision documentée (spec §9.27, pas de code) ; 28→T13. ✅ (req 27 = décision « pas de limiter custom », documentée dans le PR body Task 15, pas de task code — conforme right-sizing.)
- **§10 hors-scope** : respecté (pas de v2 fields, pas de bulk, pas de limiter custom, orders/[id] cosmétique exclu). ✅
- **Type consistency** : `ProductWriteSchema`/`ProductSchema`/`COMPAT_MAX` (T2) ↔ `parseForm` (T5) ↔ `ProductForm` name= (T7) ↔ `CompatibilityFields` name= dense (T6) ↔ `getProducts({includeDeleted})` (T3) ↔ `getCachedProducts` tag `products` (T9) ↔ `revalidateTag('products')` (T5) ↔ seed (T12) ↔ E2E (T14). Chaîne fermée.
- **Placeholders** : code complet pour le nouveau/sécurité-critique (schémas, compat reconstruction, CompatibilityFields, products-cache, rules, CSP) ; template-référence (lire fichier mergé) pour le mécanique miroir — pattern validé 4b.
