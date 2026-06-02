# Location — Back-office du parc (sous-projet A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l'admin GP Parts un CRUD complet du parc de location, et faire lire `/location` depuis la base au lieu d'un tableau codé en dur.

**Architecture:** Entité dédiée `LocationCar` (pas de réutilisation de `Vehicule`). Lecture via `DataAdapter` (Static seed + Firestore). Écritures via Server Actions + Admin SDK, patron identique au CRUD véhicules (Phase 4) : `requireAdmin` → Zod → Firestore → audit log → revalidation. Soft-delete via `deletedAt` (patron produits).

**Tech Stack:** Next.js 14 App Router, TypeScript, Zod, Firebase Admin SDK, Vitest.

Spec de référence : `docs/superpowers/specs/2026-06-02-location-parc-cms-design.md`.

**Convention prix :** centimes entiers partout (`prixJourEnCents`). Le formulaire saisit des euros → conversion `Math.round(euros * 100)` côté action. Affichage via `formatPrice()`.

---

### Task 1: Modèle de données `LocationCar` + seed

**Files:**

- Create: `lib/location-cars.ts`

- [ ] **Step 1: Écrire le type + le seed**

```ts
// lib/location-cars.ts
// Source de vérité du parc de location. Prix en CENTIMES (convention projet).
// Le seed reprend les voitures historiquement codées en dur dans
// app/location/LocationClient.tsx (à nettoyer avant le vrai lancement prod).

export type LocationCategorie = 'Citadine' | 'Berline' | 'SUV' | 'Utilitaire';

export type LocationCar = {
  id: string;
  marque: string;
  modele: string;
  categorie: LocationCategorie;
  places: number;
  transmission: string; // 'Auto' | 'Manuelle'
  carburant: string; // 'Essence' | 'Diesel' | 'Hybride'
  prixJourEnCents: number;
  prixSemaineEnCents: number;
  disponible: boolean; // dispo globale (le calendrier viendra en sous-projet C)
  image: string;
  reference: string;
  updatedAt: string; // ISO — optimistic lock + tri admin
};

export const LOCATION_CARS: LocationCar[] = [
  {
    id: 'clio-v',
    marque: 'Renault',
    modele: 'Clio V',
    categorie: 'Citadine',
    places: 5,
    transmission: 'Auto',
    carburant: 'Essence',
    prixJourEnCents: 4500,
    prixSemaineEnCents: 27000,
    disponible: true,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80&fit=crop',
    reference: 'LOC-CLIO-V',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'peugeot-308sw',
    marque: 'Peugeot',
    modele: '308 SW',
    categorie: 'Berline',
    places: 5,
    transmission: 'Auto',
    carburant: 'Diesel',
    prixJourEnCents: 6500,
    prixSemaineEnCents: 39000,
    disponible: true,
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80&fit=crop',
    reference: 'LOC-308SW',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'citroen-c5',
    marque: 'Citroën',
    modele: 'C5 Aircross',
    categorie: 'SUV',
    places: 5,
    transmission: 'Auto',
    carburant: 'Hybride',
    prixJourEnCents: 8000,
    prixSemaineEnCents: 48000,
    disponible: true,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80&fit=crop',
    reference: 'LOC-C5',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'toyota-yaris',
    marque: 'Toyota',
    modele: 'Yaris Hybride',
    categorie: 'Citadine',
    places: 5,
    transmission: 'Auto',
    carburant: 'Hybride',
    prixJourEnCents: 5200,
    prixSemaineEnCents: 31200,
    disponible: true,
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&q=80&fit=crop',
    reference: 'LOC-YARIS',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'vw-golf',
    marque: 'Volkswagen',
    modele: 'Golf VIII',
    categorie: 'Berline',
    places: 5,
    transmission: 'Auto',
    carburant: 'Essence',
    prixJourEnCents: 7200,
    prixSemaineEnCents: 43200,
    disponible: true,
    image: 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=600&q=80&fit=crop',
    reference: 'LOC-GOLF',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'renault-trafic',
    marque: 'Renault',
    modele: 'Trafic',
    categorie: 'Utilitaire',
    places: 9,
    transmission: 'Manuelle',
    carburant: 'Diesel',
    prixJourEnCents: 9500,
    prixSemaineEnCents: 57000,
    disponible: false,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80&fit=crop',
    reference: 'LOC-TRAFIC',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
];
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (pas d'erreur).

- [ ] **Step 3: Commit**

```bash
git add lib/location-cars.ts
git commit -m "feat(location): type LocationCar + seed du parc"
```

---

### Task 2: Schéma Zod `LocationCarWriteSchema`

**Files:**

- Create: `lib/schemas/location-car.ts`
- Test: `tests/unit/schemas/location-car.test.ts`

- [ ] **Step 1: Écrire le test (RED)**

```ts
// tests/unit/schemas/location-car.test.ts
import { describe, it, expect } from 'vitest';
import { parseLocationCar, LocationCarWriteSchema } from '@/lib/schemas/location-car';

const valid = {
  id: 'clio-v',
  marque: 'Renault',
  modele: 'Clio V',
  categorie: 'Citadine',
  places: 5,
  transmission: 'Auto',
  carburant: 'Essence',
  prixJourEnCents: 4500,
  prixSemaineEnCents: 27000,
  disponible: true,
  image: 'https://example.com/clio.webp',
  reference: 'LOC-CLIO-V',
  updatedAt: '2026-06-02T00:00:00.000Z',
};

describe('LocationCarWriteSchema', () => {
  it('parse une voiture valide', () => {
    expect(() => LocationCarWriteSchema.parse(valid)).not.toThrow();
  });

  it('rejette une catégorie inconnue', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, categorie: 'Cabriolet' })).toThrow();
  });

  it('rejette un prix négatif', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, prixJourEnCents: -1 })).toThrow();
  });

  it('rejette un prix non entier (float)', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, prixJourEnCents: 45.5 })).toThrow();
  });

  it('rejette places hors borne (> 9)', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, places: 12 })).toThrow();
  });

  it('rejette marque vide', () => {
    expect(() => LocationCarWriteSchema.parse({ ...valid, marque: '' })).toThrow();
  });
});

describe('parseLocationCar (lecture)', () => {
  it('renvoie un objet typé et ignore les champs inconnus (ex: deletedAt)', () => {
    const car = parseLocationCar({ ...valid, deletedAt: null });
    expect(car.id).toBe('clio-v');
    expect('deletedAt' in car).toBe(false);
  });
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `npx vitest run tests/unit/schemas/location-car.test.ts`
Expected: FAIL (module `@/lib/schemas/location-car` introuvable).

- [ ] **Step 3: Écrire le schéma (GREEN)**

```ts
// lib/schemas/location-car.ts
import { z } from 'zod';
import type { LocationCar } from '@/lib/location-cars';

export const LocationCarWriteSchema = z.object({
  id: z.string().min(1),
  marque: z.string().min(1).max(60),
  modele: z.string().min(1).max(60),
  categorie: z.enum(['Citadine', 'Berline', 'SUV', 'Utilitaire']),
  places: z.number().int().min(1).max(9),
  transmission: z.string().min(1).max(20),
  carburant: z.string().min(1).max(20),
  prixJourEnCents: z.number().int().nonnegative(),
  prixSemaineEnCents: z.number().int().nonnegative(),
  disponible: z.boolean(),
  image: z.string(),
  reference: z.string().min(1).max(40),
  updatedAt: z.string(),
});

// Lecture tolérante : même forme, mais strip les champs document (deletedAt).
export function parseLocationCar(data: unknown): LocationCar {
  return LocationCarWriteSchema.parse(data);
}
```

- [ ] **Step 4: Run test → PASS**

Run: `npx vitest run tests/unit/schemas/location-car.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/location-car.ts tests/unit/schemas/location-car.test.ts
git commit -m "feat(location): schéma Zod LocationCar + tests"
```

---

### Task 3: Méthodes adapter `getLocationCars` / `getLocationCarById`

**Files:**

- Modify: `lib/data/types.ts` (interface `DataAdapter`)
- Modify: `lib/data/static.ts` (StaticAdapter)
- Modify: `lib/data/firebase.ts` (FirebaseAdapter)
- Modify: `tests/unit/data-adapter.test.ts` (mocks + nouveaux tests)

- [ ] **Step 1: Écrire le test (RED)** — ajouter à la fin de `tests/unit/data-adapter.test.ts`

```ts
import { StaticAdapter } from '@/lib/data/static';
import { LOCATION_CARS } from '@/lib/location-cars';

describe('StaticAdapter — location cars', () => {
  it('getLocationCars renvoie le seed complet', async () => {
    const adapter = new StaticAdapter();
    const cars = await adapter.getLocationCars();
    expect(cars).toHaveLength(LOCATION_CARS.length);
    expect(cars[0].id).toBe(LOCATION_CARS[0].id);
  });

  it('getLocationCarById renvoie la bonne voiture', async () => {
    const adapter = new StaticAdapter();
    const car = await adapter.getLocationCarById('clio-v');
    expect(car?.marque).toBe('Renault');
  });

  it('getLocationCarById renvoie null si introuvable', async () => {
    const adapter = new StaticAdapter();
    expect(await adapter.getLocationCarById('inconnu')).toBeNull();
  });
});
```

> Note : si `StaticAdapter` n'est pas déjà importé dans ce fichier, ajouter l'import en tête. Ne pas dupliquer si présent.

- [ ] **Step 2: Run test → FAIL**

Run: `npx vitest run tests/unit/data-adapter.test.ts`
Expected: FAIL — `getLocationCars` n'existe pas sur `StaticAdapter` (erreur TS/runtime).

- [ ] **Step 3: Étendre l'interface** — `lib/data/types.ts`

Ajouter l'import en tête (au bloc `import type { ... } from '@/lib/types'` voisin) :

```ts
import type { LocationCar } from '@/lib/location-cars';
```

Ajouter dans l'interface `DataAdapter` (après les méthodes `getMotos`/`getDemandes`) :

```ts
  getLocationCars(opts?: { includeDeleted?: boolean }): Promise<LocationCar[]>;
  getLocationCarById(id: string): Promise<LocationCar | null>;
```

- [ ] **Step 4: Implémenter dans StaticAdapter** — `lib/data/static.ts`

Ajouter l'import en tête :

```ts
import { LOCATION_CARS } from '@/lib/location-cars';
import type { LocationCar } from '@/lib/location-cars';
```

Ajouter les méthodes (après `getMotos`) :

```ts
  async getLocationCars(): Promise<LocationCar[]> {
    warnDevFallback('getLocationCars');
    return [...LOCATION_CARS];
  }

  async getLocationCarById(id: string): Promise<LocationCar | null> {
    warnDevFallback('getLocationCarById');
    return LOCATION_CARS.find((c) => c.id === id) ?? null;
  }
```

- [ ] **Step 5: Implémenter dans FirebaseAdapter** — `lib/data/firebase.ts`

Ajouter l'import en tête (au bloc `import type { ... } from '@/lib/types'`, ajouter une ligne séparée) :

```ts
import { parseLocationCar } from '@/lib/schemas/location-car';
import type { LocationCar } from '@/lib/location-cars';
```

Ajouter la ref de collection près de `vehiculesRef` :

```ts
  private readonly locationCarsRef = collection(db, 'location-cars');
```

Ajouter les méthodes (après `getMotos`) :

```ts
  async getLocationCars(opts?: { includeDeleted?: boolean }): Promise<LocationCar[]> {
    const q = opts?.includeDeleted
      ? query(this.locationCarsRef)
      : query(this.locationCarsRef, where('deletedAt', '==', null));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => parseLocationCar({ ...d.data(), id: d.id }));
  }

  async getLocationCarById(id: string): Promise<LocationCar | null> {
    const docRef = doc(db, 'location-cars', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return parseLocationCar({ ...snap.data(), id: snap.id });
  }
```

> `where`, `query`, `getDocs`, `doc`, `getDoc`, `collection` sont déjà importés dans firebase.ts (utilisés par getProducts/getOrderById).

- [ ] **Step 6: Corriger les mocks DataAdapter** — `tests/unit/data-adapter.test.ts`

Les mocks d'adapter qui implémentent `DataAdapter` doivent gagner les 2 méthodes. Chercher chaque objet mock (ceux qui ont `getMotos: async () => [...]`) et ajouter à côté :

```ts
      getLocationCars: async () => [],
      getLocationCarById: async () => null,
```

(Même opération que l'ajout de `updateOrderPayment` en Phase 6 — repérer tous les mocks via `grep -n "getMotos" tests/unit/data-adapter.test.ts`.)

- [ ] **Step 7: Run test + typecheck → PASS**

Run: `npx vitest run tests/unit/data-adapter.test.ts && npx tsc --noEmit`
Expected: tests PASS, tsc exit 0.

- [ ] **Step 8: Commit**

```bash
git add lib/data/types.ts lib/data/static.ts lib/data/firebase.ts tests/unit/data-adapter.test.ts
git commit -m "feat(location): adapter getLocationCars + getLocationCarById"
```

---

### Task 4: Server Actions CRUD

**Files:**

- Create: `app/admin/location/actions.ts`

> Patron `app/admin/vehicules/actions.ts`. Create = `.set()` simple (ids uniques). Update = transaction + optimistic lock via `updatedAt`. Delete = soft-delete `deletedAt`. Prix saisis en euros → centimes.

- [ ] **Step 1: Écrire les actions**

```ts
// app/admin/location/actions.ts
'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { LocationCarWriteSchema } from '@/lib/schemas/location-car';
import { computeDiff } from '@/lib/admin/diff';

import type { FormActionState } from '@/components/admin/FormShell';

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// euros (string du form) → centimes entiers ; NaN → NaN (rejeté par Zod int).
function eurosToCents(raw: FormDataEntryValue | null): number {
  const euros = Number(raw);
  if (!Number.isFinite(euros)) return NaN;
  return Math.round(euros * 100);
}

function parseForm(formData: FormData) {
  const images = formData.getAll('images').map(String).filter(Boolean);
  return {
    id: sanitize(formData.get('id')),
    marque: sanitize(formData.get('marque')),
    modele: sanitize(formData.get('modele')),
    categorie: String(formData.get('categorie') ?? ''),
    places: Number(formData.get('places')),
    transmission: sanitize(formData.get('transmission')),
    carburant: sanitize(formData.get('carburant')),
    prixJourEnCents: eurosToCents(formData.get('prixJour')),
    prixSemaineEnCents: eurosToCents(formData.get('prixSemaine')),
    disponible: formData.get('disponible') === 'true',
    image: images[0] ?? '',
    reference: sanitize(formData.get('reference')),
    updatedAt: new Date().toISOString(),
  };
}

function revalidateLocation(): void {
  revalidateTag('location-cars');
  revalidatePath('/location');
}

export async function createLocationCar(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = LocationCarWriteSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const db = getAdminFirestore();
  await db.doc(`location-cars/${data.id}`).set({ ...data, deletedAt: null });

  await writeAuditLog({
    actor: session.email,
    action: 'create',
    resourceType: 'location-car',
    resourceId: data.id,
  });

  revalidateLocation();
  redirect('/admin/location');
}

export async function updateLocationCar(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = LocationCarWriteSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const clientUpdatedAt = String(formData.get('clientUpdatedAt') ?? '');

  const db = getAdminFirestore();
  const ref = db.doc(`location-cars/${data.id}`);

  let conflict = false;
  let auditDiff: Record<string, { before: unknown; after: unknown }> = {};
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }
    tx.update(ref, data);
    auditDiff = computeDiff(before, data as Record<string, unknown>);
  });

  if (conflict) {
    return {
      errors: { _form: ['Cette voiture a été modifiée entre-temps. Rechargez la page.'] },
    };
  }

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'location-car',
    resourceId: data.id,
    diff: auditDiff,
  });

  revalidateLocation();
  return { ok: true, message: 'Voiture mise à jour.' };
}

export async function deleteLocationCar(id: string): Promise<FormActionState> {
  const session = await requireAdmin();

  const db = getAdminFirestore();
  await db.doc(`location-cars/${id}`).update({
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actor: session.email,
    action: 'delete',
    resourceType: 'location-car',
    resourceId: id,
  });

  revalidateLocation();
  return { ok: true, message: 'Voiture supprimée.' };
}
```

- [ ] **Step 2: Vérifier `writeAuditLog` accepte `resourceType: 'location-car'`**

Run: `grep -n "resourceType" lib/admin/audit.ts`
Si `resourceType` est typé en union fermée (ex: `'product' | 'vehicule' | ...`), ajouter `'location-car'` à l'union dans `lib/admin/audit.ts`. Si c'est `string`, rien à faire.
Expected: l'un ou l'autre — adapter en conséquence.

- [ ] **Step 3: Typecheck → PASS**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/admin/location/actions.ts lib/admin/audit.ts
git commit -m "feat(location): server actions create/update/delete"
```

---

### Task 5: Formulaire `LocationCarForm` + folder ImageUploader

**Files:**

- Modify: `components/admin/ImageUploader.tsx` (ajouter `'location'` au type folder)
- Create: `components/admin/LocationCarForm.tsx`

- [ ] **Step 1: Étendre le type folder** — `components/admin/ImageUploader.tsx`

Remplacer (ligne ~48) :

```ts
folder: 'vehicules' | 'motos' | 'products';
```

par :

```ts
folder: 'vehicules' | 'motos' | 'products' | 'location';
```

- [ ] **Step 2: Écrire le formulaire** — `components/admin/LocationCarForm.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormShell, FieldError, SubmitButton } from '@/components/admin/FormShell';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { createLocationCar, updateLocationCar } from '@/app/admin/location/actions';

import type { LocationCar } from '@/lib/location-cars';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

// centimes → euros pour pré-remplir le champ (édition)
const toEuros = (cents?: number) => (cents != null ? cents / 100 : undefined);

export function LocationCarForm({ initial }: { initial?: LocationCar }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [carId] = useState(() => initial?.id ?? `location-${Date.now().toString(36)}`);
  const [images, setImages] = useState<string[]>(initial?.image ? [initial.image] : []);

  return (
    <FormShell
      action={isEdit ? updateLocationCar : createLocationCar}
      onSuccess={() => router.push('/admin/location')}
      successMessage={isEdit ? 'Voiture mise à jour.' : 'Voiture créée.'}
    >
      <input type="hidden" name="id" value={carId} />
      {isEdit && <input type="hidden" name="clientUpdatedAt" value={initial!.updatedAt} />}
      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <legend className={LABEL}>Identité</legend>
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
        <div>
          <label className={LABEL} htmlFor="categorie">
            Catégorie
          </label>
          <select
            id="categorie"
            name="categorie"
            defaultValue={initial?.categorie ?? 'Citadine'}
            className={FIELD}
          >
            <option value="Citadine">Citadine</option>
            <option value="Berline">Berline</option>
            <option value="SUV">SUV</option>
            <option value="Utilitaire">Utilitaire</option>
          </select>
          <FieldError name="categorie" />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <legend className={LABEL}>Caractéristiques</legend>
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
        <div>
          <label className={LABEL} htmlFor="transmission">
            Transmission
          </label>
          <select
            id="transmission"
            name="transmission"
            defaultValue={initial?.transmission ?? 'Auto'}
            className={FIELD}
          >
            <option value="Auto">Auto</option>
            <option value="Manuelle">Manuelle</option>
          </select>
          <FieldError name="transmission" />
        </div>
        <div>
          <label className={LABEL} htmlFor="carburant">
            Carburant
          </label>
          <select
            id="carburant"
            name="carburant"
            defaultValue={initial?.carburant ?? 'Essence'}
            className={FIELD}
          >
            <option value="Essence">Essence</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybride">Hybride</option>
          </select>
          <FieldError name="carburant" />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <legend className={LABEL}>Commercial</legend>
        <div>
          <label className={LABEL} htmlFor="prixJour">
            Prix / jour (€)
          </label>
          <input
            id="prixJour"
            name="prixJour"
            type="number"
            step="0.01"
            defaultValue={toEuros(initial?.prixJourEnCents)}
            className={FIELD}
          />
          <FieldError name="prixJourEnCents" />
        </div>
        <div>
          <label className={LABEL} htmlFor="prixSemaine">
            Prix / semaine (€)
          </label>
          <input
            id="prixSemaine"
            name="prixSemaine"
            type="number"
            step="0.01"
            defaultValue={toEuros(initial?.prixSemaineEnCents)}
            className={FIELD}
          />
          <FieldError name="prixSemaineEnCents" />
        </div>
        <div>
          <label className={LABEL} htmlFor="disponible">
            Disponible
          </label>
          <select
            id="disponible"
            name="disponible"
            defaultValue={initial ? String(initial.disponible) : 'true'}
            className={FIELD}
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
          <FieldError name="disponible" />
        </div>
      </fieldset>

      <div>
        <p className={LABEL}>Photo</p>
        <ImageUploader
          folder="location"
          entityId={carId}
          value={images}
          onChange={setImages}
          max={1}
        />
        <FieldError name="image" />
      </div>

      <SubmitButton>{isEdit ? 'Enregistrer' : 'Créer la voiture'}</SubmitButton>
    </FormShell>
  );
}
```

- [ ] **Step 3: Typecheck → PASS**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/admin/ImageUploader.tsx components/admin/LocationCarForm.tsx
git commit -m "feat(location): LocationCarForm + folder location ImageUploader"
```

---

### Task 6: Routes admin (liste + table + new + édition)

**Files:**

- Create: `app/admin/(shell)/location/page.tsx`
- Create: `app/admin/(shell)/location/LocationCarsTable.tsx`
- Create: `app/admin/(shell)/location/new/page.tsx`
- Create: `app/admin/(shell)/location/[id]/page.tsx`

- [ ] **Step 1: Table** — `app/admin/(shell)/location/LocationCarsTable.tsx`

```tsx
'use client';

import Link from 'next/link';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { formatPrice } from '@/lib/utils';

import type { LocationCar } from '@/lib/location-cars';

const columns: Column<LocationCar>[] = [
  {
    key: 'voiture',
    header: 'Voiture',
    sortValue: (c) => `${c.marque} ${c.modele}`.toLowerCase(),
    render: (c) => (
      <span className="font-medium text-[var(--text)]">
        {c.marque} {c.modele}
      </span>
    ),
  },
  {
    key: 'categorie',
    header: 'Catégorie',
    sortValue: (c) => c.categorie,
    render: (c) => c.categorie,
  },
  {
    key: 'prixJour',
    header: 'Prix / jour',
    align: 'right',
    sortValue: (c) => c.prixJourEnCents,
    render: (c) => formatPrice(c.prixJourEnCents),
  },
  {
    key: 'disponible',
    header: 'Statut',
    sortValue: (c) => String(c.disponible),
    render: (c) => (
      <StatusBadge tone={c.disponible ? ('success' as BadgeTone) : ('neutral' as BadgeTone)}>
        {c.disponible ? 'Disponible' : 'Indisponible'}
      </StatusBadge>
    ),
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (c) => (
      <Link
        href={`/admin/location/${c.id}`}
        className="text-body-sm font-semibold"
        style={{ color: 'var(--blue)' }}
      >
        Éditer
      </Link>
    ),
  },
];

export function LocationCarsTable({ cars }: { cars: LocationCar[] }) {
  return (
    <DataTable
      rows={cars}
      columns={columns}
      getRowId={(c) => c.id}
      searchText={(c) => `${c.marque} ${c.modele} ${c.reference}`}
      searchPlaceholder="Rechercher une voiture…"
      emptyTitle="Aucune voiture"
      emptyDescription="Ajoutez votre première voiture de location avec le bouton ci-dessus."
    />
  );
}
```

- [ ] **Step 2: Page liste** — `app/admin/(shell)/location/page.tsx`

```tsx
import Link from 'next/link';

import { getAdapter } from '@/lib/data';

import { LocationCarsTable } from './LocationCarsTable';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Location — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminLocationPage() {
  const adapter = await getAdapter();
  const cars = await adapter.getLocationCars();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title font-semibold text-[var(--text)]">Location</h1>
        <Link
          href="/admin/location/new"
          className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white inline-flex items-center"
          style={{ background: 'var(--blue)' }}
        >
          + Nouvelle voiture
        </Link>
      </div>
      <LocationCarsTable cars={cars} />
    </div>
  );
}
```

- [ ] **Step 3: Page new** — `app/admin/(shell)/location/new/page.tsx`

```tsx
import { LocationCarForm } from '@/components/admin/LocationCarForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouvelle voiture — Admin GP Parts',
};

export default function NewLocationCarPage() {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouvelle voiture</h1>
      <LocationCarForm />
    </div>
  );
}
```

- [ ] **Step 4: Page édition** — `app/admin/(shell)/location/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation';

import { LocationCarForm } from '@/components/admin/LocationCarForm';
import { getAdapter } from '@/lib/data';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer voiture — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditLocationCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adapter = await getAdapter();
  const car = await adapter.getLocationCarById(id);
  if (!car) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">
        {car.marque} {car.modele}
      </h1>
      <LocationCarForm initial={car} />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + build → PASS**

Run: `npx tsc --noEmit && npm run build`
Expected: tsc exit 0 ; build OK avec les routes `/admin/location`, `/admin/location/new`, `/admin/location/[id]`.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(shell)/location"
git commit -m "feat(location): routes admin liste/new/edit + table"
```

---

### Task 7: Lien sidebar « Location »

**Files:**

- Modify: `components/admin/AdminSidebar.tsx`

> Le fix du lien Pièces 404 + `enabled: true` du Catalogue a déjà été committé sur cette branche. Ici on ajoute uniquement l'item Location.

- [ ] **Step 1: Ajouter l'icône à l'import lucide** — `components/admin/AdminSidebar.tsx`

Ajouter `CarFront` à la liste des imports `lucide-react` du fichier (à côté de `Car`, `Bike`, etc.).

- [ ] **Step 2: Ajouter l'item dans la section Catalogue**

Dans le tableau `SECTIONS`, section `title: 'Catalogue'`, après l'item Motos :

```ts
      { href: '/admin/location', label: 'Location', icon: CarFront, enabled: true },
```

- [ ] **Step 3: Typecheck → PASS**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminSidebar.tsx
git commit -m "feat(location): item sidebar Location"
```

---

### Task 8: Câblage storefront `/location`

**Files:**

- Modify: `app/location/page.tsx`
- Modify: `app/location/LocationClient.tsx`

> Objectif : `LocationClient` reçoit les voitures en props (plus de `const VEHICULES` codé en dur), prix affichés via `formatPrice()`. Filtres catégorie + formulaire de réservation factice INCHANGÉS (réservation = sous-projet B).

- [ ] **Step 1: Lire la structure actuelle de `app/location/page.tsx`**

Run: `cat app/location/page.tsx`
But : savoir comment `LocationClient` est rendu aujourd'hui (probablement `<LocationClient />` sans props).

- [ ] **Step 2: Page serveur passe les voitures dispo en props** — `app/location/page.tsx`

Adapter la page pour charger l'adapter et filtrer les disponibles. Forme cible (ajuster aux imports/SEO existants du fichier — ne pas supprimer le `metadata`/JSON-LD s'il existe) :

```tsx
import { getAdapter } from '@/lib/data';
import { LocationClient } from './LocationClient';

export const dynamic = 'force-dynamic';

export default async function LocationPage() {
  const adapter = await getAdapter();
  const cars = (await adapter.getLocationCars()).filter((c) => c.disponible);
  return <LocationClient cars={cars} />;
}
```

- [ ] **Step 3: `LocationClient` accepte les props + supprime le hardcode** — `app/location/LocationClient.tsx`

Remplacer la déclaration `const VEHICULES = [ ... ];` (≈ lignes 21-101) par une dérivation des props. Modifier la signature du composant :

```tsx
import type { LocationCar } from '@/lib/location-cars';
import { formatPrice } from '@/lib/utils';

// ... (garder les types Categorie / Step / ReservationData existants)

export function LocationClient({ cars }: { cars: LocationCar[] }) {
  const VEHICULES = cars; // source = parc géré en admin
  // ... reste du composant inchangé
```

> Si le composant était `export default function LocationClient()`, conserver le même style d'export que celui attendu par `page.tsx` (import nommé ci-dessus → exporter `LocationClient` nommé, ou ajuster l'import de page.tsx).

- [ ] **Step 4: Remplacer l'affichage des prix bruts par `formatPrice`**

Dans le JSX, les prix utilisaient `prixJour` / `prixSemaine` (euros bruts, ex: `{v.prixJour}€`). Les remplacer par les champs centimes + `formatPrice` :

- `{v.prixJour}€/jour` → `{formatPrice(v.prixJourEnCents)} / jour`
- `{v.prixSemaine}€` (semaine) → `{formatPrice(v.prixSemaineEnCents)}`
- partout où `vehiculeSelectionne.prixJour` est utilisé (calcul du total réservation) : utiliser `prixJourEnCents` et formater via `formatPrice`. Le calcul `total = nbJours * prix` doit se faire en centimes : `nbJours * vehiculeSelectionne.prixJourEnCents`, affiché via `formatPrice`.

> Le champ `dispo` du hardcode devient `disponible` : remplacer toute lecture `v.dispo` par `v.disponible`.

- [ ] **Step 5: Typecheck + build → PASS**

Run: `npx tsc --noEmit && npm run build`
Expected: tsc exit 0 ; `/location` build OK.

- [ ] **Step 6: Vérification visuelle locale**

Run (StaticAdapter forcé pour voir le seed) :

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-gp-parts npm run dev
```

Ouvrir `http://localhost:3000/location` → les 5 voitures `disponible:true` du seed s'affichent (Trafic exclu car `disponible:false`), prix au format `45,00 € / jour`.

- [ ] **Step 7: Commit**

```bash
git add app/location/page.tsx app/location/LocationClient.tsx
git commit -m "feat(location): storefront lit l'adapter (fin du hardcode) + formatPrice"
```

---

### Task 9: Script de seed Firestore

**Files:**

- Create: `scripts/seed-location-cars.ts`

> Idempotent : skip si le doc existe déjà. Utilise l'Admin SDK (mêmes credentials que les actions). À lancer une fois pour peupler la collection en dev/prod.

- [ ] **Step 1: Vérifier s'il existe un script de seed à mirror**

Run: `ls scripts/ && grep -rln "getAdminFirestore\|firebase-admin" scripts/ 2>/dev/null`
But : réutiliser le pattern d'un seed existant s'il y en a un (sinon créer ex-nihilo ci-dessous).

- [ ] **Step 2: Écrire le script**

```ts
// scripts/seed-location-cars.ts
// Peuple la collection Firestore `location-cars` depuis le seed LOCATION_CARS.
// Idempotent : ne réécrit pas un doc déjà présent.
// Lancer : npx tsx scripts/seed-location-cars.ts
import { getAdminFirestore } from '../lib/firebase-admin';
import { LOCATION_CARS } from '../lib/location-cars';

async function main() {
  const db = getAdminFirestore();
  let created = 0;
  let skipped = 0;
  for (const car of LOCATION_CARS) {
    const ref = db.doc(`location-cars/${car.id}`);
    const snap = await ref.get();
    if (snap.exists) {
      skipped++;
      continue;
    }
    await ref.set({ ...car, deletedAt: null });
    created++;
  }
  console.log(`[seed-location-cars] créés: ${created}, ignorés (déjà présents): ${skipped}`);
}

main().catch((err) => {
  console.error('[seed-location-cars] échec:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Vérifier le typecheck du script**

Run: `npx tsc --noEmit`
Expected: exit 0. (Le script n'est PAS lancé en CI — exécution manuelle ponctuelle avec les credentials Admin.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-location-cars.ts
git commit -m "feat(location): script de seed Firestore idempotent"
```

---

### Task 10: Gate final CI

**Files:** aucun (vérification).

- [ ] **Step 1: Suite unit complète**

Run: `npx vitest run`
Expected: tous verts (≥ 416 + nouveaux tests location).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 0 nouvelle erreur/warning (le warning pré-existant `lib/schemas/product.ts` est toléré).

- [ ] **Step 4: Format**

Run: `npx prettier --check "**/*.{ts,tsx,json,css,md}" --ignore-path .prettierignore`
Si des fichiers créés sont flaggés : `npx prettier --write <fichiers>` puis recommit.
Expected: « All matched files use Prettier code style! » (hors fichiers gitignored coverage/test-results).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build OK, routes `/admin/location*` et `/location` présentes.

- [ ] **Step 6: Push + PR**

```bash
git push -u origin feat/location-parc-cms
gh pr create --base main --title "feat(location): back-office du parc (sous-projet A)" --body "Voir docs/superpowers/specs/2026-06-02-location-parc-cms-design.md"
```

Attendre CI verte avant merge.

---

## Notes d'exécution

- **Convention prix** : centimes partout. Seul le formulaire saisit/affiche des euros (conversion aux frontières).
- **Soft-delete** : `deletedAt` (comme produits), pas un statut comme véhicules. `getLocationCars` filtre `deletedAt == null`.
- **Réservations** : le formulaire `/location` reste factice dans A — corrigé en sous-projet B.
- **Seed prod** : `scripts/seed-location-cars.ts` à lancer manuellement une fois ; nettoyage des données démo avant vrai lancement (hors A).
