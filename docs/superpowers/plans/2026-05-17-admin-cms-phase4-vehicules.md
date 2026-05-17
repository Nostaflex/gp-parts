# Admin CMS Phase 4a — CRUD Véhicules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le back-office gère le CRUD des véhicules en Firestore ; les pages publiques `/vente-vehicule` reflètent les changements via ISR.

**Architecture:** Server Actions protégées par `requireAdmin()` (Phase 3) écrivent dans Firestore via Admin SDK, journalisent dans `audit_log` (Phase 3) et invalident le cache via `revalidateTag`. Validation Zod partagée form/Firestore. Pages publiques lues via `unstable_cache(getAdapter().getVehicules(), tags:['vehicules'])`. Réutilise `FormShell`, `ImageUploader`, `DataTable`, `StatusBadge`, `ConfirmDialog` (Phase 2).

**Tech Stack:** Next.js 15.5 / React 19.2 (Server Actions, `useActionState`, `unstable_cache`), Firebase Admin SDK (Firestore), Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-17-admin-cms-phase4-vehicules-design.md`

**Branche:** `feat/admin-cms-phase4-vehicules` (déjà créée, design doc committé).

---

## Décisions verrouillées (issues du design)

- `Vehicule.prix` = **euros entiers** (`18900` = 18 900 €), PAS centimes. Ne pas « corriger ».
- Soft delete = `disponibilite: 'vendu'` (champ existant). Pas de `deletedAt`.
- Optimistic lock : `FormActionState` n'a **pas** de variante `{ conflict }`. Un conflit 409 retourne `{ errors: { _form: ['Ce véhicule a été modifié entre-temps. Rechargez la page.'] } }`.
- Écriture = `getAdminFirestore()` (Admin SDK Phase 3). Lecture publique = `getAdapter().getVehicules()` (StaticAdapter dev / FirebaseAdapter prod, Phase 3).
- Contrat Server Action = `FormActionState` (de `components/admin/FormShell.tsx`) : `{ ok:true, message? } | { ok?:false, errors: Record<string,string[]|undefined> } | null`.

## File Structure

| Fichier                                      | Responsabilité                              | Action                       |
| -------------------------------------------- | ------------------------------------------- | ---------------------------- |
| `lib/vehicules.ts`                           | Type `Vehicule` + fixtures + helpers        | Modifier (ajout `updatedAt`) |
| `lib/schemas/vehicule.ts`                    | Zod schema + `parseVehicule`                | Créer                        |
| `lib/admin/diff.ts`                          | `computeDiff(before, after)` pour audit log | Créer                        |
| `app/admin/vehicules/actions.ts`             | Server Actions create/update/delete         | Créer                        |
| `app/admin/vehicules/page.tsx`               | Liste véhicules + bouton Nouveau            | Créer                        |
| `app/admin/vehicules/new/page.tsx`           | Création                                    | Créer                        |
| `app/admin/vehicules/[id]/page.tsx`          | Édition                                     | Créer                        |
| `components/admin/VehiculeForm.tsx`          | Formulaire ~20 champs dans FormShell        | Créer                        |
| `lib/data/vehicules-cache.ts`                | `getCachedVehicules()` via `unstable_cache` | Créer                        |
| `app/vente-vehicule/page.tsx`                | Liste publique                              | Modifier (SSG→ISR)           |
| `app/vente-vehicule/[id]/page.tsx`           | Fiche publique                              | Modifier (SSG→ISR)           |
| `scripts/seed-vehicules-firestore.ts`        | Migration 7 VEHICULES → Firestore           | Créer                        |
| `firebase.json`                              | + section storage                           | Modifier                     |
| `storage.rules`                              | Règles Storage (read public / write admin)  | Créer                        |
| `tests/unit/schemas/vehicule.test.ts`        | Tests schema                                | Créer                        |
| `tests/unit/admin-diff.test.ts`              | Tests computeDiff                           | Créer                        |
| `tests/unit/admin-vehicules-actions.test.ts` | Tests Server Actions                        | Créer                        |
| `tests/unit/data-adapter.test.ts`            | + régression `updatedAt` fixtures           | Modifier                     |
| `tests/e2e/admin-vehicules.spec.ts`          | Flow admin E2E                              | Créer                        |
| `tests/e2e/vente-vehicule-public.spec.ts`    | Anti-régression pages publiques             | Créer                        |

---

## Task 1 : Type `Vehicule` + migration fixtures (`updatedAt`)

**Files:**

- Modify: `lib/vehicules.ts`
- Test: `tests/unit/data-adapter.test.ts` (régression existante)

- [ ] **Step 1: Écrire le test de régression**

Ajouter dans `tests/unit/data-adapter.test.ts`, dans le `describe('StaticAdapter — vehicules/motos/demandes', ...)` existant :

```typescript
it('chaque véhicule statique a un updatedAt ISO (régression Phase 4)', async () => {
  const vehicules = await adapter.getVehicules();
  for (const v of vehicules) {
    expect(typeof v.updatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(v.updatedAt))).toBe(false);
  }
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `npx vitest run tests/unit/data-adapter.test.ts -t "updatedAt ISO"`
Expected: FAIL — `expected 'undefined' to be 'string'` (le type n'a pas `updatedAt`).

- [ ] **Step 3: Ajouter `updatedAt` au type**

Dans `lib/vehicules.ts`, dans `export type Vehicule = { ... }`, ajouter après `disponibilite: Disponibilite;` :

```typescript
updatedAt: string; // ISO date — optimistic lock + tri admin (Phase 4)
```

- [ ] **Step 4: Ajouter `updatedAt` aux 7 fixtures**

Pour chacun des 7 objets de `export const VEHICULES`, ajouter le champ `updatedAt` (juste après `disponibilite`). Valeur : date de référence stable (les véhicules existaient avant le suivi) :

```typescript
    updatedAt: '2026-05-01T00:00:00.000Z',
```

(Identique pour les 7 — c'est une date de seed initiale, pas une donnée métier distincte.)

- [ ] **Step 5: Lancer le test, vérifier le succès**

Run: `npx vitest run tests/unit/data-adapter.test.ts`
Expected: PASS (28 + 1 = 29 tests).

- [ ] **Step 6: Vérifier la non-régression typecheck (pages publiques)**

Run: `npx tsc --noEmit`
Expected: 0 erreur. (Si une page publique construisait un `Vehicule` littéral, tsc le signalerait — sinon RAS, les fixtures sont la seule source.)

- [ ] **Step 7: Commit**

```bash
git add lib/vehicules.ts tests/unit/data-adapter.test.ts
git commit -m "feat(vehicules): ajout updatedAt au type Vehicule + fixtures (Phase 4)"
```

---

## Task 2 : Schema Zod `lib/schemas/vehicule.ts`

**Files:**

- Create: `lib/schemas/vehicule.ts`
- Test: `tests/unit/schemas/vehicule.test.ts`

- [ ] **Step 1: Écrire les tests**

Créer `tests/unit/schemas/vehicule.test.ts` :

```typescript
import { describe, it, expect } from 'vitest';
import { parseVehicule, VehiculeSchema } from '@/lib/schemas/vehicule';

const valid = {
  id: 'peugeot-308sw',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '308 SW GT Line',
  annee: 2021,
  km: 42000,
  energie: 'Diesel',
  transmission: 'BVA',
  places: 5,
  options: ['Climatisation', 'GPS'],
  prix: 18900,
  mensualite: 289,
  image: 'https://example.com/a.webp',
  images: ['https://example.com/a.webp'],
  description: 'Très bon état.',
  caracteristiques: { puissance: '130 ch' },
  reference: 'REF-001',
  disponibilite: 'disponible',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('VehiculeSchema', () => {
  it('parse un véhicule valide', () => {
    expect(() => parseVehicule(valid)).not.toThrow();
  });

  it('rejette une année hors borne (avant 1990)', () => {
    expect(() => parseVehicule({ ...valid, annee: 1980 })).toThrow();
  });

  it('rejette une année future de plus d’un an', () => {
    const tooFar = new Date().getFullYear() + 2;
    expect(() => parseVehicule({ ...valid, annee: tooFar })).toThrow();
  });

  it('rejette plus de 5 images', () => {
    const six = Array(6).fill('https://example.com/x.webp');
    expect(() => parseVehicule({ ...valid, images: six })).toThrow();
  });

  it('rejette zéro image', () => {
    expect(() => parseVehicule({ ...valid, images: [] })).toThrow();
  });

  it('rejette un prix négatif', () => {
    expect(() => parseVehicule({ ...valid, prix: -1 })).toThrow();
  });

  it('rejette un prix non entier', () => {
    expect(() => parseVehicule({ ...valid, prix: 18900.5 })).toThrow();
  });

  it('rejette un champ requis manquant (marque)', () => {
    const { marque, ...sansMarque } = valid;
    expect(() => parseVehicule(sansMarque)).toThrow();
  });

  it('safeParse expose les erreurs par champ', () => {
    const res = VehiculeSchema.safeParse({ ...valid, prix: -1, annee: 1980 });
    expect(res.success).toBe(false);
    if (!res.success) {
      const f = res.error.flatten().fieldErrors;
      expect(f.prix).toBeDefined();
      expect(f.annee).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run tests/unit/schemas/vehicule.test.ts`
Expected: FAIL — module `@/lib/schemas/vehicule` introuvable.

- [ ] **Step 3: Implémenter le schema**

Créer `lib/schemas/vehicule.ts` (miroir exact du type `Vehicule`, pattern `lib/schemas/product.ts`) :

```typescript
import { z } from 'zod';
import type { Vehicule } from '@/lib/vehicules';

const currentYear = new Date().getFullYear();

const caracteristiquesSchema = z.object({
  puissance: z.string().optional(),
  cylindree: z.string().optional(),
  consommation: z.string().optional(),
  co2: z.string().optional(),
  couleur: z.string().optional(),
  carrosserie: z.string().optional(),
  portes: z.number().int().optional(),
  critAir: z.string().optional(),
  premiereCirculation: z.string().optional(),
  proprietaires: z.number().int().optional(),
  garantie: z.string().optional(),
});

export const VehiculeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['occasion', 'neuf']),
  marque: z.string().min(1),
  modele: z.string().min(1),
  annee: z
    .number()
    .int()
    .min(1990)
    .max(currentYear + 1),
  km: z.number().int().min(0),
  energie: z.enum(['Essence', 'Diesel', 'Hybride']),
  transmission: z.string().min(1),
  places: z.number().int().min(1).max(9),
  options: z.array(z.string()),
  prix: z.number().int().nonnegative(), // euros entiers (convention Vehicule)
  mensualite: z.number().int().nonnegative(),
  image: z.string().url(),
  images: z.array(z.string().url()).min(1).max(5),
  description: z.string().min(1),
  caracteristiques: caracteristiquesSchema,
  reference: z.string().min(1),
  disponibilite: z.enum(['disponible', 'reserve', 'vendu']),
  updatedAt: z.string(),
});

export function parseVehicule(data: unknown): Vehicule {
  // VehiculeSchema miroir exact de Vehicule (types structurellement identiques)
  return VehiculeSchema.parse(data) as Vehicule;
}
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `npx vitest run tests/unit/schemas/vehicule.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/vehicule.ts tests/unit/schemas/vehicule.test.ts
git commit -m "feat(vehicules): schema Zod VehiculeSchema + parseVehicule"
```

---

## Task 3 : Helper `computeDiff`

**Files:**

- Create: `lib/admin/diff.ts`
- Test: `tests/unit/admin-diff.test.ts`

- [ ] **Step 1: Écrire les tests**

Créer `tests/unit/admin-diff.test.ts` :

```typescript
import { describe, it, expect } from 'vitest';
import { computeDiff } from '@/lib/admin/diff';

describe('computeDiff', () => {
  it('retourne les champs changés avec before/after', () => {
    const d = computeDiff({ prix: 18900, km: 42000 }, { prix: 17900, km: 42000 });
    expect(d).toEqual({ prix: { before: 18900, after: 17900 } });
  });

  it('ignore les champs inchangés', () => {
    const d = computeDiff({ a: 1, b: 2 }, { a: 1, b: 2 });
    expect(d).toEqual({});
  });

  it('détecte un changement dans un objet imbriqué (égalité profonde)', () => {
    const d = computeDiff(
      { caracteristiques: { puissance: '130 ch' } },
      { caracteristiques: { puissance: '150 ch' } }
    );
    expect(d).toEqual({
      caracteristiques: {
        before: { puissance: '130 ch' },
        after: { puissance: '150 ch' },
      },
    });
  });

  it('détecte un changement dans un tableau', () => {
    const d = computeDiff({ options: ['ABS'] }, { options: ['ABS', 'GPS'] });
    expect(d.options).toBeDefined();
  });

  it('inclut les nouvelles clés présentes uniquement dans after', () => {
    const d = computeDiff({ a: 1 }, { a: 1, b: 2 });
    expect(d).toEqual({ b: { before: undefined, after: 2 } });
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run tests/unit/admin-diff.test.ts`
Expected: FAIL — module `@/lib/admin/diff` introuvable.

- [ ] **Step 3: Implémenter**

Créer `lib/admin/diff.ts` :

```typescript
/**
 * Diff superficiel par clé pour l'audit log (Phase 4).
 * Égalité profonde via JSON pour objets/tableaux imbriqués
 * (caracteristiques, options). Suffisant : pas de fonctions ni dates
 * dans les documents véhicule.
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      diff[key] = { before: b, after: a };
    }
  }
  return diff;
}
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `npx vitest run tests/unit/admin-diff.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/admin/diff.ts tests/unit/admin-diff.test.ts
git commit -m "feat(admin): helper computeDiff pour audit log"
```

---

## Task 4 : Server Actions véhicules

**Files:**

- Create: `app/admin/vehicules/actions.ts`
- Test: `tests/unit/admin-vehicules-actions.test.ts`

- [ ] **Step 1: Écrire les tests**

Créer `tests/unit/admin-vehicules-actions.test.ts`. Mock du même style que `tests/unit/admin-audit.test.ts` (Phase 3) :

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAdminMock = vi.fn();
const writeAuditLogMock = vi.fn();
const revalidateTagMock = vi.fn();

const setMock = vi.fn();
const updateMock = vi.fn();
const getMock = vi.fn();
const txGetMock = vi.fn();
const txUpdateMock = vi.fn();
const txSetMock = vi.fn();
const runTransactionMock = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
  await cb({ get: txGetMock, update: txUpdateMock, set: txSetMock });
});
const docMock = vi.fn(() => ({ set: setMock, update: updateMock, get: getMock }));
const collectionMock = vi.fn(() => ({ doc: docMock }));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: requireAdminMock,
  AdminError: class AdminError extends Error {
    status: number;
    constructor(m: string, s: number) {
      super(m);
      this.name = 'AdminError';
      this.status = s;
    }
  },
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: writeAuditLogMock }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({
    doc: docMock,
    collection: collectionMock,
    runTransaction: runTransactionMock,
  })),
}));
vi.mock('next/cache', () => ({ revalidateTag: revalidateTagMock }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { createVehicule, updateVehicule, deleteVehicule } from '@/app/admin/vehicules/actions';

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

const base = {
  id: 'peugeot-308sw',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '308 SW',
  annee: '2021',
  km: '42000',
  energie: 'Diesel',
  transmission: 'BVA',
  places: '5',
  options: 'Climatisation\nGPS',
  prix: '18900',
  mensualite: '289',
  image: 'https://example.com/a.webp',
  images: 'https://example.com/a.webp',
  description: 'Bon état.',
  reference: 'REF-1',
  disponibilite: 'disponible',
};

describe('Server Actions véhicules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'djemil.david@gmail.com' });
  });

  it('createVehicule : admin requis, set Firestore, audit log, revalidate', async () => {
    const res = await createVehicule(null, fd(base));
    expect(requireAdminMock).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledTimes(1);
    const written = setMock.mock.calls[0][0];
    expect(written.marque).toBe('Peugeot');
    expect(written.prix).toBe(18900);
    expect(written.options).toEqual(['Climatisation', 'GPS']);
    expect(typeof written.updatedAt).toBe('string');
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        resourceType: 'vehicule',
        resourceId: 'peugeot-308sw',
      })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('vehicules');
    expect(res).toBeUndefined(); // redirect() en succès
  });

  it('createVehicule : Zod invalide → { errors } sans écrire', async () => {
    const res = await createVehicule(null, fd({ ...base, prix: '-1' }));
    expect(setMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: expect.objectContaining({ prix: expect.any(Array) }) });
  });

  it('createVehicule : non-admin → AdminError propagée', async () => {
    requireAdminMock.mockRejectedValue(
      Object.assign(new Error('Accès admin refusé'), { name: 'AdminError', status: 403 })
    );
    await expect(createVehicule(null, fd(base))).rejects.toMatchObject({ status: 403 });
  });

  it('updateVehicule : updatedAt concordant → update + diff audit', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, prix: 18900, updatedAt: '2026-05-01T00:00:00.000Z' }),
    });
    const res = await updateVehicule(
      null,
      fd({ ...base, prix: '17900', updatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(txUpdateMock).toHaveBeenCalled();
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'vehicule' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('vehicule:peugeot-308sw');
    expect(res).toMatchObject({ ok: true });
  });

  it('updateVehicule : conflit optimistic lock → { errors._form }', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, updatedAt: '2026-05-10T00:00:00.000Z' }),
    });
    const res = await updateVehicule(null, fd({ ...base, updatedAt: '2026-05-01T00:00:00.000Z' }));
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('deleteVehicule : soft → disponibilite vendu + audit', async () => {
    const res = await deleteVehicule('peugeot-308sw');
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ disponibilite: 'vendu' }));
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'delete', resourceType: 'vehicule' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('vehicules');
    expect(res).toMatchObject({ ok: true });
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run tests/unit/admin-vehicules-actions.test.ts`
Expected: FAIL — module `@/app/admin/vehicules/actions` introuvable.

- [ ] **Step 3: Implémenter les Server Actions**

Créer `app/admin/vehicules/actions.ts` :

```typescript
'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { VehiculeSchema } from '@/lib/schemas/vehicule';
import { computeDiff } from '@/lib/admin/diff';

import type { FormActionState } from '@/components/admin/FormShell';

/**
 * Convertit le FormData du VehiculeForm en objet typé Vehicule.
 * - options : textarea 1/ligne → string[]
 * - images : valeurs multiples (ImageUploader pousse N champs `images`)
 * - image : dérivé = images[0]
 * - nombres : coercition
 * - updatedAt : injecté côté serveur (ignore toute valeur cliente sauf
 *   le champ caché lu séparément pour l'optimistic lock)
 */
function parseForm(formData: FormData) {
  const images = formData.getAll('images').map(String).filter(Boolean);
  const optionsRaw = String(formData.get('options') ?? '');
  const num = (k: string) => Number(formData.get(k));

  const carac = {
    puissance: String(formData.get('car_puissance') ?? '') || undefined,
    cylindree: String(formData.get('car_cylindree') ?? '') || undefined,
    consommation: String(formData.get('car_consommation') ?? '') || undefined,
    co2: String(formData.get('car_co2') ?? '') || undefined,
    couleur: String(formData.get('car_couleur') ?? '') || undefined,
    carrosserie: String(formData.get('car_carrosserie') ?? '') || undefined,
    critAir: String(formData.get('car_critair') ?? '') || undefined,
    premiereCirculation: String(formData.get('car_premiere_circulation') ?? '') || undefined,
    garantie: String(formData.get('car_garantie') ?? '') || undefined,
  };

  return {
    id: String(formData.get('id') ?? ''),
    type: String(formData.get('type') ?? ''),
    marque: String(formData.get('marque') ?? ''),
    modele: String(formData.get('modele') ?? ''),
    annee: num('annee'),
    km: num('km'),
    energie: String(formData.get('energie') ?? ''),
    transmission: String(formData.get('transmission') ?? ''),
    places: num('places'),
    options: optionsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    prix: num('prix'),
    mensualite: num('mensualite'),
    image: images[0] ?? '',
    images,
    description: String(formData.get('description') ?? ''),
    caracteristiques: carac,
    reference: String(formData.get('reference') ?? ''),
    disponibilite: String(formData.get('disponibilite') ?? ''),
    updatedAt: new Date().toISOString(),
  };
}

export async function createVehicule(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = VehiculeSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const db = getAdminFirestore();
  await db.doc(`vehicules/${data.id}`).set(data);

  await writeAuditLog({
    actor: session.email,
    action: 'create',
    resourceType: 'vehicule',
    resourceId: data.id,
  });

  revalidateTag('vehicules');
  revalidateTag(`vehicule:${data.id}`);
  redirect('/admin/vehicules');
}

export async function updateVehicule(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = VehiculeSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const clientUpdatedAt = String(formData.get('updatedAt') ?? '');

  const db = getAdminFirestore();
  const ref = db.doc(`vehicules/${data.id}`);

  let conflict = false;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }
    tx.update(ref, data);
    await writeAuditLog({
      actor: session.email,
      action: 'update',
      resourceType: 'vehicule',
      resourceId: data.id,
      diff: computeDiff(before, data as Record<string, unknown>),
    });
  });

  if (conflict) {
    return {
      errors: {
        _form: ['Ce véhicule a été modifié entre-temps. Rechargez la page.'],
      },
    };
  }

  revalidateTag('vehicules');
  revalidateTag(`vehicule:${data.id}`);
  return { ok: true, message: 'Véhicule mis à jour.' };
}

export async function deleteVehicule(id: string): Promise<FormActionState> {
  const session = await requireAdmin();

  const db = getAdminFirestore();
  await db.doc(`vehicules/${id}`).update({
    disponibilite: 'vendu',
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actor: session.email,
    action: 'delete',
    resourceType: 'vehicule',
    resourceId: id,
  });

  revalidateTag('vehicules');
  revalidateTag(`vehicule:${id}`);
  return { ok: true, message: 'Véhicule marqué comme vendu.' };
}
```

> Note : `writeAuditLog` à l'intérieur de la transaction est volontaire (audit lié à la mutation). Le `await` dans `runTransaction` est toléré (Admin SDK rejoue le callback si contention — acceptable au volume 1 admin).

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `npx vitest run tests/unit/admin-vehicules-actions.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add app/admin/vehicules/actions.ts tests/unit/admin-vehicules-actions.test.ts
git commit -m "feat(admin-vehicules): Server Actions create/update/delete + optimistic lock"
```

---

## Task 5 : `VehiculeForm` (composant)

**Files:**

- Create: `components/admin/VehiculeForm.tsx`
- Test: aucun unitaire (composant client lourd ; couvert par E2E Task 9). Vérif : typecheck + build.

- [ ] **Step 1: Implémenter le formulaire**

Créer `components/admin/VehiculeForm.tsx`. Utilise `FormShell`/`FieldError`/`SubmitButton` (Phase 2) et `ImageUploader` (Phase 2). `id` généré au montage si création (slugify marque+modèle+random court) :

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormShell, FieldError, SubmitButton } from '@/components/admin/FormShell';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { createVehicule, updateVehicule } from '@/app/admin/vehicules/actions';

import type { Vehicule } from '@/lib/vehicules';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

export function VehiculeForm({ initial }: { initial?: Vehicule }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [vehiculeId] = useState(
    () => initial?.id ?? `${slugify('vehicule')}-${Date.now().toString(36)}`
  );
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  return (
    <FormShell
      action={isEdit ? updateVehicule : createVehicule}
      onSuccess={() => router.push('/admin/vehicules')}
      successMessage={isEdit ? 'Véhicule mis à jour.' : 'Véhicule créé.'}
    >
      <input type="hidden" name="id" value={vehiculeId} />
      {isEdit && <input type="hidden" name="updatedAt" value={initial!.updatedAt} />}
      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      {/* Identité */}
      <fieldset className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="marque">
            Marque
          </label>
          <input id="marque" name="marque" defaultValue={initial?.marque} className={FIELD} />
          <FieldError name="marque" />
        </div>
        <div>
          <label className={LABEL} htmlFor="modele">
            Modèle
          </label>
          <input id="modele" name="modele" defaultValue={initial?.modele} className={FIELD} />
          <FieldError name="modele" />
        </div>
        <div>
          <label className={LABEL} htmlFor="type">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initial?.type ?? 'occasion'}
            className={FIELD}
          >
            <option value="occasion">Occasion</option>
            <option value="neuf">Neuf</option>
          </select>
          <FieldError name="type" />
        </div>
        <div>
          <label className={LABEL} htmlFor="reference">
            Référence
          </label>
          <input
            id="reference"
            name="reference"
            defaultValue={initial?.reference}
            className={FIELD}
          />
          <FieldError name="reference" />
        </div>
      </fieldset>

      {/* Technique */}
      <fieldset className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="annee">
            Année
          </label>
          <input
            id="annee"
            name="annee"
            type="number"
            defaultValue={initial?.annee}
            className={FIELD}
          />
          <FieldError name="annee" />
        </div>
        <div>
          <label className={LABEL} htmlFor="km">
            Kilométrage
          </label>
          <input id="km" name="km" type="number" defaultValue={initial?.km} className={FIELD} />
          <FieldError name="km" />
        </div>
        <div>
          <label className={LABEL} htmlFor="energie">
            Énergie
          </label>
          <select
            id="energie"
            name="energie"
            defaultValue={initial?.energie ?? 'Essence'}
            className={FIELD}
          >
            <option>Essence</option>
            <option>Diesel</option>
            <option>Hybride</option>
          </select>
          <FieldError name="energie" />
        </div>
        <div>
          <label className={LABEL} htmlFor="transmission">
            Transmission
          </label>
          <input
            id="transmission"
            name="transmission"
            defaultValue={initial?.transmission}
            className={FIELD}
          />
          <FieldError name="transmission" />
        </div>
        <div>
          <label className={LABEL} htmlFor="places">
            Places
          </label>
          <input
            id="places"
            name="places"
            type="number"
            defaultValue={initial?.places ?? 5}
            className={FIELD}
          />
          <FieldError name="places" />
        </div>
      </fieldset>

      {/* Commercial */}
      <fieldset className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL} htmlFor="prix">
            Prix (€)
          </label>
          <input
            id="prix"
            name="prix"
            type="number"
            defaultValue={initial?.prix}
            className={FIELD}
          />
          <FieldError name="prix" />
        </div>
        <div>
          <label className={LABEL} htmlFor="mensualite">
            Mensualité (€)
          </label>
          <input
            id="mensualite"
            name="mensualite"
            type="number"
            defaultValue={initial?.mensualite}
            className={FIELD}
          />
          <FieldError name="mensualite" />
        </div>
        <div>
          <label className={LABEL} htmlFor="disponibilite">
            Disponibilité
          </label>
          <select
            id="disponibilite"
            name="disponibilite"
            defaultValue={initial?.disponibilite ?? 'disponible'}
            className={FIELD}
          >
            <option value="disponible">Disponible</option>
            <option value="reserve">Réservé</option>
            <option value="vendu">Vendu</option>
          </select>
          <FieldError name="disponibilite" />
        </div>
      </fieldset>

      {/* Contenu */}
      <div>
        <label className={LABEL} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description}
          className={FIELD.replace('h-11', 'py-2')}
        />
        <FieldError name="description" />
      </div>
      <div>
        <label className={LABEL} htmlFor="options">
          Options (une par ligne)
        </label>
        <textarea
          id="options"
          name="options"
          rows={3}
          defaultValue={initial?.options?.join('\n')}
          className={FIELD.replace('h-11', 'py-2')}
        />
      </div>

      {/* Caractéristiques (toutes optionnelles) */}
      <fieldset className="grid grid-cols-3 gap-3">
        <input
          name="car_puissance"
          placeholder="Puissance"
          defaultValue={initial?.caracteristiques.puissance}
          className={FIELD}
        />
        <input
          name="car_cylindree"
          placeholder="Cylindrée"
          defaultValue={initial?.caracteristiques.cylindree}
          className={FIELD}
        />
        <input
          name="car_couleur"
          placeholder="Couleur"
          defaultValue={initial?.caracteristiques.couleur}
          className={FIELD}
        />
        <input
          name="car_consommation"
          placeholder="Consommation"
          defaultValue={initial?.caracteristiques.consommation}
          className={FIELD}
        />
        <input
          name="car_co2"
          placeholder="CO2"
          defaultValue={initial?.caracteristiques.co2}
          className={FIELD}
        />
        <input
          name="car_garantie"
          placeholder="Garantie"
          defaultValue={initial?.caracteristiques.garantie}
          className={FIELD}
        />
      </fieldset>

      {/* Photos */}
      <div>
        <label className={LABEL}>Photos (5 max)</label>
        <ImageUploader
          folder="vehicules"
          entityId={vehiculeId}
          value={images}
          onChange={setImages}
          max={5}
        />
      </div>

      <SubmitButton>{isEdit ? 'Enregistrer' : 'Créer le véhicule'}</SubmitButton>
    </FormShell>
  );
}
```

> Vérification d'API à l'exécution : confirmer la signature exacte de `ImageUploader` (lue : `folder`, `entityId`, `value`, `onChange`, `max`). Si la prop diffère, adapter cet appel — ne pas modifier `ImageUploader`.

- [ ] **Step 2: Vérifier typecheck**

Run: `npx tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 3: Commit**

```bash
git add components/admin/VehiculeForm.tsx
git commit -m "feat(admin-vehicules): VehiculeForm (FormShell + ImageUploader)"
```

---

## Task 6 : Pages admin (liste / new / edit)

**Files:**

- Create: `app/admin/vehicules/page.tsx`
- Create: `app/admin/vehicules/new/page.tsx`
- Create: `app/admin/vehicules/[id]/page.tsx`
- Test: typecheck + build (E2E couvre le comportement, Task 9).

- [ ] **Step 1: Page liste**

Créer `app/admin/vehicules/page.tsx` :

```tsx
import Link from 'next/link';
import { getAdapter } from '@/lib/data';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const dynamic = 'force-dynamic';

const DISPO_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  disponible: 'success',
  reserve: 'warning',
  vendu: 'neutral',
};

export default async function AdminVehiculesPage() {
  const adapter = await getAdapter();
  const vehicules = await adapter.getVehicules();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title font-semibold text-[var(--text)]">Véhicules</h1>
        <Link
          href="/admin/vehicules/new"
          className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white inline-flex items-center"
          style={{ background: 'var(--blue)' }}
        >
          + Nouveau véhicule
        </Link>
      </div>

      <DataTable
        rows={vehicules}
        getRowKey={(v) => v.id}
        columns={[
          {
            header: 'Véhicule',
            cell: (v) => `${v.marque} ${v.modele}`,
          },
          { header: 'Année', cell: (v) => String(v.annee) },
          { header: 'Prix', cell: (v) => `${v.prix.toLocaleString('fr-FR')} €` },
          {
            header: 'Statut',
            cell: (v) => (
              <StatusBadge variant={DISPO_VARIANT[v.disponibilite] ?? 'neutral'}>
                {v.disponibilite}
              </StatusBadge>
            ),
          },
          {
            header: '',
            cell: (v) => (
              <Link href={`/admin/vehicules/${v.id}`} className="text-[var(--blue)]">
                Éditer
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
```

> Vérification d'API à l'exécution : confirmer les props réelles de `DataTable` et `StatusBadge` (Phase 2) — `grep -n "export function DataTable\|interface.*Props" components/admin/DataTable.tsx components/admin/StatusBadge.tsx`. Adapter `columns`/`rows`/`variant` à la signature réelle. Ne pas modifier ces composants.

- [ ] **Step 2: Page création**

Créer `app/admin/vehicules/new/page.tsx` :

```tsx
import { VehiculeForm } from '@/components/admin/VehiculeForm';

export default function NewVehiculePage() {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouveau véhicule</h1>
      <VehiculeForm />
    </div>
  );
}
```

- [ ] **Step 3: Page édition**

Créer `app/admin/vehicules/[id]/page.tsx` :

```tsx
import { notFound } from 'next/navigation';
import { getAdapter } from '@/lib/data';
import { VehiculeForm } from '@/components/admin/VehiculeForm';

export const dynamic = 'force-dynamic';

export default async function EditVehiculePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adapter = await getAdapter();
  const vehicules = await adapter.getVehicules();
  const vehicule = vehicules.find((v) => v.id === id);
  if (!vehicule) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {vehicule.marque} {vehicule.modele}
      </h1>
      <VehiculeForm initial={vehicule} />
    </div>
  );
}
```

- [ ] **Step 4: Vérifier typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: 0 erreur, build OK. (Si props `DataTable`/`StatusBadge` ne matchent pas → corriger les pages, pas les composants.)

- [ ] **Step 5: Commit**

```bash
git add app/admin/vehicules/page.tsx app/admin/vehicules/new/page.tsx "app/admin/vehicules/[id]/page.tsx"
git commit -m "feat(admin-vehicules): pages liste / new / edit"
```

---

## Task 7 : Cache ISR + bascule pages publiques

**Files:**

- Create: `lib/data/vehicules-cache.ts`
- Modify: `app/vente-vehicule/page.tsx`
- Modify: `app/vente-vehicule/[id]/page.tsx`
- Test: `tests/e2e/vente-vehicule-public.spec.ts` (Task 9 ; ici typecheck+build)

- [ ] **Step 1: Wrapper de cache**

Créer `lib/data/vehicules-cache.ts` :

```typescript
import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { Vehicule } from '@/lib/vehicules';

/**
 * Lecture publique des véhicules, cachée et invalidable par tag.
 * `revalidateTag('vehicules')` (Server Actions admin) purge ce cache →
 * pages publiques ISR régénérées à la demande. Préserve la perf type-SSG
 * et le cache CDN Vercel (anti-bandwidth Firestore, spec §9).
 */
export const getCachedVehicules = unstable_cache(
  async (): Promise<Vehicule[]> => {
    const adapter = await getAdapter();
    return adapter.getVehicules();
  },
  ['vehicules-public'],
  { tags: ['vehicules'] }
);
```

- [ ] **Step 2: Adapter la liste publique**

Dans `app/vente-vehicule/page.tsx` : remplacer l'import et l'usage de `VEHICULES` (statique) par `getCachedVehicules()`.

Remplacer :

```tsx
import { VEHICULES } from '@/lib/vehicules';
```

par :

```tsx
import { getCachedVehicules } from '@/lib/data/vehicules-cache';
```

Rendre le composant `async` et lire les données :

```tsx
export default async function VenteVehiculePage() {
  const vehicules = await getCachedVehicules();
  // ... passer `vehicules` à <VenteVehiculeClient vehicules={vehicules} />
```

> À l'exécution : lire le fichier réel d'abord (`Read app/vente-vehicule/page.tsx`). Adapter aux props réelles de `VenteVehiculeClient`. Si le client recevait `VEHICULES` importé directement, lui passer `vehicules` en prop. Filtrer `disponibilite !== 'vendu'` côté affichage si la version statique le faisait déjà (préserver le comportement).

- [ ] **Step 3: Adapter la fiche publique**

Dans `app/vente-vehicule/[id]/page.tsx` : remplacer `VEHICULES` / `getVehiculeById` (statique) par `getCachedVehicules()` + find.

`generateStaticParams` lit Firestore via le cache :

```tsx
import { getCachedVehicules } from '@/lib/data/vehicules-cache';

export async function generateStaticParams() {
  const vehicules = await getCachedVehicules();
  return vehicules.map((v) => ({ id: v.id }));
}
```

Et dans le composant page, remplacer `getVehiculeById(id)` par :

```tsx
const vehicules = await getCachedVehicules();
const vehicule = vehicules.find((v) => v.id === id);
if (!vehicule) notFound();
```

Ajouter le tag de revalidation fine au niveau du segment :

```tsx
export const revalidate = 3600; // filet ISR ; revalidateTag prime sur mutation
```

> À l'exécution : `Read` le fichier réel avant édition. Conserver `notFound()`, `generateMetadata`, et le passage des données aux composants enfants (`FinancementSimulator`, `VehiculeGallery`) inchangés en signature.

- [ ] **Step 4: Vérifier typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: 0 erreur. Build : `/vente-vehicule` et `/vente-vehicule/[id]` toujours générées (SSG/ISR), pas d'erreur de fetch au build (StaticAdapter en build local — pas de Firebase env → fixtures, OK).

- [ ] **Step 5: Commit**

```bash
git add lib/data/vehicules-cache.ts app/vente-vehicule/page.tsx "app/vente-vehicule/[id]/page.tsx"
git commit -m "feat(vehicules): pages publiques SSG→ISR via unstable_cache + revalidateTag"
```

---

## Task 8 : Storage rules + script de seed

**Files:**

- Create: `storage.rules`
- Modify: `firebase.json`
- Create: `scripts/seed-vehicules-firestore.ts`

- [ ] **Step 1: Règles Storage**

Créer `storage.rules` (read public, write admin — réutilise le critère whitelist Phase 3) :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null
          && request.auth.token.email_verified == true
          && firestore.exists(/databases/(default)/documents/meta/admins)
          && firestore.get(/databases/(default)/documents/meta/admins)
               .data.emails.hasAny([request.auth.token.email]);
    }
    match /vehicules/{vehiculeId}/{photo} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

- [ ] **Step 2: Référencer les rules dans `firebase.json`**

Lire `firebase.json` puis ajouter la clé `storage` au même niveau que `firestore` :

```json
  "storage": {
    "rules": "storage.rules"
  }
```

- [ ] **Step 3: Script de seed idempotent**

Créer `scripts/seed-vehicules-firestore.ts` (pattern `scripts/setup-ttl-policies.ts` Phase 0/3 — Admin SDK, `.set()` = upsert idempotent) :

```typescript
/**
 * Migre les 7 VEHICULES statiques vers Firestore (collection `vehicules`).
 * Idempotent : .set() par doc ID = upsert. Relançable sans doublon.
 *
 * Usage (émulateur ou cloud, credentials via env comme firebase-admin.ts) :
 *   npx tsx scripts/seed-vehicules-firestore.ts
 */
import { getAdminFirestore } from '../lib/firebase-admin';
import { VEHICULES } from '../lib/vehicules';

async function main() {
  const db = getAdminFirestore();
  let n = 0;
  for (const v of VEHICULES) {
    await db.doc(`vehicules/${v.id}`).set(v);
    n++;
    console.log(`  ✓ ${v.id}`);
  }
  console.log(`Seed terminé : ${n} véhicules.`);
}

main().catch((e) => {
  console.error('Seed échoué :', e);
  process.exit(1);
});
```

- [ ] **Step 4: Vérifier typecheck du script**

Run: `npx tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 5: Commit**

```bash
git add storage.rules firebase.json scripts/seed-vehicules-firestore.ts
git commit -m "feat(vehicules): storage rules + script seed Firestore idempotent"
```

---

## Task 9 : Tests E2E (flow admin + anti-régression public)

**Files:**

- Create: `tests/e2e/admin-vehicules.spec.ts`
- Create: `tests/e2e/vente-vehicule-public.spec.ts`

- [ ] **Step 1: Lire un E2E admin existant pour le pattern de login**

Run: `ls tests/e2e/ && grep -rl "admin/login\|emulator-login\|__session" tests/e2e/ | head -1`
Lire ce fichier. Réutiliser exactement son helper de login admin (ne pas réinventer l'auth émulateur).

- [ ] **Step 2: E2E anti-régression pages publiques**

Créer `tests/e2e/vente-vehicule-public.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pages publiques véhicules (anti-régression P4)', () => {
  test('la liste /vente-vehicule rend au moins un véhicule', async ({ page }) => {
    await page.goto('/vente-vehicule');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Au moins une carte véhicule (lien vers une fiche)
    await expect(page.locator('a[href^="/vente-vehicule/"]').first()).toBeVisible();
  });

  test('une fiche véhicule rend (prix + titre)', async ({ page }) => {
    await page.goto('/vente-vehicule');
    await page.locator('a[href^="/vente-vehicule/"]').first().click();
    await expect(page).toHaveURL(/\/vente-vehicule\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
```

- [ ] **Step 3: E2E flow admin**

Créer `tests/e2e/admin-vehicules.spec.ts` (adapter le helper de login depuis Step 1) :

```typescript
import { test, expect } from '@playwright/test';
// import { loginAsAdmin } from './helpers'; // ← utiliser le helper réel repéré au Step 1

test.describe('Admin véhicules — CRUD (émulateur)', () => {
  test('liste accessible après login', async ({ page }) => {
    // await loginAsAdmin(page);
    await page.goto('/admin/vehicules');
    await expect(page.getByRole('heading', { name: 'Véhicules' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Nouveau véhicule/ })).toBeVisible();
  });

  test('page nouveau véhicule affiche le formulaire', async ({ page }) => {
    // await loginAsAdmin(page);
    await page.goto('/admin/vehicules/new');
    await expect(page.getByLabel('Marque')).toBeVisible();
    await expect(page.getByLabel('Prix (€)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Créer le véhicule/ })).toBeVisible();
  });

  test('édition d’un véhicule seedé pré-remplit le formulaire', async ({ page }) => {
    // await loginAsAdmin(page);
    await page.goto('/admin/vehicules/peugeot-308sw');
    await expect(page.getByLabel('Marque')).toHaveValue('Peugeot');
  });
});
```

> À l'exécution : décommenter et utiliser le vrai helper de login (Step 1). Si l'E2E tourne contre l'émulateur Firestore, le seed (Task 8) doit avoir été exécuté contre l'émulateur, ou les tests d'édition ciblent un véhicule garanti présent. Si l'env E2E n'a pas Firebase → adapter (lecture via StaticAdapter qui contient déjà `peugeot-308sw`).

- [ ] **Step 4: Lancer les E2E**

Run: `npx playwright test tests/e2e/vente-vehicule-public.spec.ts tests/e2e/admin-vehicules.spec.ts`
Expected: PASS. (Si échec login → corriger l'usage du helper, pas le helper.)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/admin-vehicules.spec.ts tests/e2e/vente-vehicule-public.spec.ts
git commit -m "test(admin-vehicules): E2E flow admin + anti-régression pages publiques"
```

---

## Task 10 : Audit qualité complet + PR

- [ ] **Step 1: Suite complète + qualité**

Run :

```bash
npx tsc --noEmit
npm run lint
npx prettier --check $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx)$' | tr '\n' ' ')
npx vitest run
npm run build
```

Expected : tsc 0 err · lint 0 warn · prettier clean · **vitest 0 régression** (baseline 223 + nouveaux : 1 régression Task1 + 9 schema + 5 diff + 6 actions = 244) · build OK.

- [ ] **Step 2: Corriger toute régression avant de continuer**

Si un test pré-existant casse → c'est un impact-map manqué. Le réparer (ne pas désactiver). Re-run Step 1 jusqu'au vert complet.

- [ ] **Step 3: Push + PR**

```bash
git push -u origin feat/admin-cms-phase4-vehicules
gh pr create --title "feat(admin-cms): Phase 4a — CRUD véhicules" --body "Voir docs/superpowers/specs/2026-05-17-admin-cms-phase4-vehicules-design.md. CRUD véhicules Firestore (Server Actions + requireAdmin + audit log + optimistic lock), pages publiques SSG→ISR, seed idempotent. TDD strict. 🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 4: Attendre CI verte avant merge**

`gh pr checks <n>` — job principal **et** Playwright E2E verts. Règle d'or roadmap : pas de Phase 4b (motos) tant que CI Phase 4a rouge. Ne pas merger avant vert complet.

---

## Self-Review (rempli par l'auteur du plan)

**1. Couverture spec :**

- §1 périmètre → Tasks 1-9 (tout le scope véhicules, motos exclues OK)
- §2 schema/type/Storage → Task 1 (type), Task 2 (Zod), Task 8 (Storage rules)
- §3 Server Actions → Task 4 (create/update/delete + optimistic lock + audit)
- §4 pages/UI → Task 5 (form), Task 6 (pages)
- §5 tests/ISR/seed/risques → Task 7 (ISR), Task 8 (seed), Task 9 (E2E), Task 10 (vérif)
- Aucun trou.

**2. Placeholders :** aucun TBD/TODO. Les notes « à l'exécution : Read le fichier réel » concernent des fichiers existants non modifiables à l'aveugle (props composants P2, pages publiques) — c'est de la prudence d'intégration, pas un placeholder de logique. Le code à écrire est fourni en entier.

**3. Cohérence des types :**

- `FormActionState` (de `FormShell`) utilisé partout pour les Server Actions ; conflit 409 → `{ errors: { _form } }` (pas de variante `{ conflict }` inventée). Cohérent Task 4 ↔ Task 5.
- `Vehicule` avec `updatedAt` : Task 1 le définit, Tasks 2/4/5/7 le consomment.
- `getAdminFirestore` / `requireAdmin` / `writeAuditLog` : signatures Phase 3 réelles (vérifiées dans le code).
- `getAdapter().getVehicules()` : signature Phase 3 réelle.
- `computeDiff(before, after)` : signature Task 3 = usage Task 4.

Plan cohérent. Prêt pour exécution.
