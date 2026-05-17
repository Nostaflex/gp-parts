# Admin CMS Phase 4b — CRUD Motos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Miroir exact de Phase 4a (CRUD véhicules, PR #21 mergée `0b91151`) appliqué aux motos, avec les deltas du type `Moto` vs `Vehicule`.

**Architecture:** Identique à 4a. Les fichiers véhicule **mergés sur main** sont le template de référence (à lire, pas à re-transcrire). Phase 4b = dupliquer en remplaçant `vehicule`→`moto`, `Vehicule`→`Moto`, `vehicules`→`motos`, `VEHICULES`→`MOTOS`, en appliquant les **deltas de champs** ci-dessous.

**Tech Stack:** Next.js 15.5 / React 19, Firebase Admin SDK, Zod, Vitest, Playwright.

**Référence design:** `docs/superpowers/specs/2026-05-17-admin-cms-phase4-vehicules-design.md` §"motos = Phase 4b, même pattern".

**Branche:** `feat/admin-cms-phase4b-motos` (créée).

---

## Deltas `Moto` vs `Vehicule` (CRITIQUE — appliquer partout)

Type `Moto` (`lib/motos.ts`) vs `Vehicule` :

| Aspect                  | Vehicule                                                                                          | Moto                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Champ `transmission`    | présent (string)                                                                                  | **ABSENT**                                                                                    |
| Champ `places`          | présent (number)                                                                                  | **ABSENT**                                                                                    |
| Champ `categorie`       | absent                                                                                            | **PRÉSENT** : `CategorieMoto = 'Roadster'\|'Sport'\|'Trail'\|'Scooter'\|'Custom'\|'Routière'` |
| `energie` enum          | `'Essence'\|'Diesel'\|'Hybride'`                                                                  | `EnergieMoto = 'Essence'\|'Électrique'`                                                       |
| `type` enum             | `'occasion'\|'neuf'`                                                                              | `TypeMoto = 'occasion'\|'neuf'` (identique)                                                   |
| `disponibilite`         | `'disponible'\|'reserve'\|'vendu'`                                                                | identique                                                                                     |
| `caracteristiques` type | `Caracteristiques`                                                                                | `CaracteristiquesMoto`                                                                        |
| Carac communes          | puissance, cylindree, consommation, couleur, premiereCirculation, proprietaires(number), garantie | idem                                                                                          |
| Carac EN PLUS (moto)    | —                                                                                                 | `poids?: string`, `permis?: Permis` (`'A1'\|'A2'\|'A'\|'AM'`)                                 |
| Carac EN MOINS (moto)   | co2, carrosserie, portes, critAir                                                                 | absentes                                                                                      |
| `updatedAt`             | présent (ajouté 4a)                                                                               | **À AJOUTER** (Task 1b)                                                                       |

7 fixtures `MOTOS` : yamaha-mt07, honda-cb500x, kawasaki-z900, piaggio-mp3-500, bmw-r1250gs, honda-pcx-125-neuf, yamaha-tracer-9-neuf.

## File Structure

| Fichier                                  | Action                                  | Template 4a (lire sur main)                      |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| `lib/motos.ts`                           | Modifier (+updatedAt type + 7 fixtures) | `lib/vehicules.ts`                               |
| `lib/schemas/moto.ts`                    | Créer                                   | `lib/schemas/vehicule.ts`                        |
| `app/admin/motos/actions.ts`             | Créer                                   | `app/admin/vehicules/actions.ts`                 |
| `components/admin/MotoForm.tsx`          | Créer                                   | `components/admin/VehiculeForm.tsx`              |
| `app/admin/(shell)/motos/page.tsx`       | Créer                                   | `app/admin/(shell)/vehicules/page.tsx`           |
| `app/admin/(shell)/motos/MotosTable.tsx` | Créer                                   | `app/admin/(shell)/vehicules/VehiculesTable.tsx` |
| `app/admin/(shell)/motos/new/page.tsx`   | Créer                                   | `.../vehicules/new/page.tsx`                     |
| `app/admin/(shell)/motos/[id]/page.tsx`  | Créer                                   | `.../vehicules/[id]/page.tsx`                    |
| `lib/data/motos-cache.ts`                | Créer                                   | `lib/data/vehicules-cache.ts`                    |
| `app/vente-moto/page.tsx`                | Modifier (SSG→ISR)                      | `app/vente-vehicule/page.tsx`                    |
| `app/vente-moto/[id]/page.tsx`           | Modifier (SSG→ISR)                      | `app/vente-vehicule/[id]/page.tsx`               |
| `app/vente-moto/VenteMotoClient.tsx`     | Modifier (prop)                         | `app/vente-vehicule/VenteVehiculeClient.tsx`     |
| `scripts/seed-firestore.ts`              | Modifier (+motos)                       | bloc vehicules déjà présent                      |
| `tests/unit/schemas/moto.test.ts`        | Créer                                   | `tests/unit/schemas/vehicule.test.ts`            |
| `tests/unit/admin-motos-actions.test.ts` | Créer                                   | `tests/unit/admin-vehicules-actions.test.ts`     |
| `tests/unit/data-adapter.test.ts`        | Modifier (régression updatedAt motos)   | —                                                |
| `tests/e2e/vente-moto-public.spec.ts`    | Créer                                   | `tests/e2e/vente-vehicule-public.spec.ts`        |
| `tests/e2e/admin-motos.spec.ts`          | Créer                                   | `tests/e2e/admin-vehicules.spec.ts`              |

**Déjà fait (NE PAS refaire)** : `storage.rules` couvre `motos/{motoId}/{file=**}` (vérifié). `ImageUploader` supporte `folder='motos'` (vérifié). `lib/admin/diff.ts` générique (réutiliser tel quel). `DataAdapter.getMotos()` + `StaticAdapter.getMotos()` existent (Phase 3 ; `warnDevFallback` déjà appliqué 4a → retourne `[...MOTOS]` en prod). `firebase.json` storage déjà configuré.

**Leçons 4a intégrées d'emblée (éviter les 3 escalades)** :

1. `generateStaticParams` de `[id]/page.tsx` : lit l'adapter DIRECT (`await import('@/lib/data')` → `getMotos()`), JAMAIS `getCachedMotos()` (`unstable_cache` throw hors contexte requête). `generateMetadata` + Page : utilisent `getCachedMotos()`.
2. `parseForm` (actions) : strip les `undefined`/vides des caractéristiques (Firestore Admin rejette `undefined`). Champs numériques (`proprietaires`) : clé posée seulement si number valide.
3. `FormActionState` : conflit optimistic-lock → `{ errors: { _form: [...] } }` (pas de variante inventée). `writeAuditLog` POST-commit (hors transaction).
4. Form responsive : `grid grid-cols-1 sm:grid-cols-N` (Stéphane mobile).
5. Sanitize champs texte (fonction `sanitize` identique à `commande/actions.ts`).

---

## Task 1b : `Moto.updatedAt` + fixtures

**Files:** Modify `lib/motos.ts` ; Test `tests/unit/data-adapter.test.ts`.

- [ ] **Step 1:** Dans `tests/unit/data-adapter.test.ts`, dans le `describe('StaticAdapter — vehicules/motos/demandes', ...)`, ajouter :

```typescript
it('chaque moto statique a un updatedAt ISO (régression Phase 4b)', async () => {
  const motos = await adapter.getMotos();
  for (const m of motos) {
    expect(typeof m.updatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(m.updatedAt))).toBe(false);
  }
});
```

- [ ] **Step 2:** Run `npx vitest run tests/unit/data-adapter.test.ts -t "moto statique a un updatedAt"` → FAIL (`expected 'undefined' to be 'string'`). Si autre raison, STOP.
- [ ] **Step 3:** Dans `lib/motos.ts`, type `Moto`, ajouter après `disponibilite: Disponibilite;` :

```typescript
updatedAt: string; // ISO date — optimistic lock + tri admin (Phase 4b)
```

- [ ] **Step 4:** Ajouter `updatedAt` aux 7 fixtures `MOTOS`, après leur `disponibilite`, **7 dates distinctes croissantes** (cohérent avec ce qu'a fait 4a pour testabilité tri) :
  - yamaha-mt07 : `'2026-04-16T00:00:00.000Z'`
  - honda-cb500x : `'2026-04-21T00:00:00.000Z'`
  - kawasaki-z900 : `'2026-04-26T00:00:00.000Z'`
  - piaggio-mp3-500 : `'2026-05-01T00:00:00.000Z'`
  - bmw-r1250gs : `'2026-05-03T00:00:00.000Z'`
  - honda-pcx-125-neuf : `'2026-05-06T00:00:00.000Z'`
  - yamaha-tracer-9-neuf : `'2026-05-09T00:00:00.000Z'`
- [ ] **Step 5:** Run `npx vitest run tests/unit/data-adapter.test.ts` → PASS (count +1). `npx tsc --noEmit` → 0 err.
- [ ] **Step 6:** Commit `git add lib/motos.ts tests/unit/data-adapter.test.ts && git commit -m "feat(motos): updatedAt type Moto + 7 fixtures (Phase 4b)"`

---

## Task 2b : `lib/schemas/moto.ts`

**Files:** Create `lib/schemas/moto.ts` ; Test `tests/unit/schemas/moto.test.ts`.

- [ ] **Step 1:** Lire `lib/schemas/vehicule.ts` (template) sur le repo. Créer `tests/unit/schemas/moto.test.ts` : copie de `tests/unit/schemas/vehicule.test.ts` en adaptant l'objet `valid` aux champs Moto (pas de `transmission`/`places`, ajouter `categorie: 'Roadster'`, `energie: 'Essence'`, caracteristiques `{ puissance:'73 ch', permis:'A2' }`) et le nom du module importé `@/lib/schemas/moto` (`parseMoto`, `MotoSchema`). Garder les 9 cas (valide, année<1990, année>+1, >5 images, 0 image, prix<0, prix non entier, champ requis manquant, safeParse fieldErrors).
- [ ] **Step 2:** Run `npx vitest run tests/unit/schemas/moto.test.ts` → FAIL (module introuvable).
- [ ] **Step 3:** Créer `lib/schemas/moto.ts`, miroir de `lib/schemas/vehicule.ts` avec deltas :

```typescript
import { z } from 'zod';
import type { Moto } from '@/lib/motos';

const currentYear = new Date().getFullYear(); // intentionally evaluated at module load

const motoCaracteristiquesSchema = z.object({
  puissance: z.string().optional(),
  cylindree: z.string().optional(),
  consommation: z.string().optional(),
  poids: z.string().optional(),
  couleur: z.string().optional(),
  permis: z.enum(['A1', 'A2', 'A', 'AM']).optional(),
  premiereCirculation: z.string().optional(),
  proprietaires: z.number().int().optional(),
  garantie: z.string().optional(),
});

export const MotoSchema = z.object({
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
  categorie: z.enum(['Roadster', 'Sport', 'Trail', 'Scooter', 'Custom', 'Routière']),
  energie: z.enum(['Essence', 'Électrique']),
  options: z.array(z.string()),
  prix: z.number().int().nonnegative(),
  mensualite: z.number().int().nonnegative(),
  image: z.string().url(),
  images: z.array(z.string().url()).min(1).max(5),
  description: z.string().min(1),
  caracteristiques: motoCaracteristiquesSchema,
  reference: z.string().min(1),
  disponibilite: z.enum(['disponible', 'reserve', 'vendu']),
  updatedAt: z.string(),
});

export function parseMoto(data: unknown): Moto {
  // MotoSchema mirrors Moto exactly — Zod infers structurally identical types
  return MotoSchema.parse(data);
}
```

- [ ] **Step 4:** Run `npx vitest run tests/unit/schemas/moto.test.ts` → PASS (9). `npx tsc --noEmit` → 0 err. Si tsc échoue sans cast sur `parseMoto`, c'est une divergence Moto↔MotoSchema réelle : corriger le schéma, PAS ajouter de cast.
- [ ] **Step 5:** Commit `git add lib/schemas/moto.ts tests/unit/schemas/moto.test.ts && git commit -m "feat(motos): schema Zod MotoSchema + parseMoto"`

---

## Task 3b : (aucune) — `lib/admin/diff.ts` réutilisé tel quel

`computeDiff` est générique (commit `3fe8786`). Aucun fichier. Les Server Actions motos l'importent directement. Pas de task.

---

## Task 4b : `app/admin/motos/actions.ts`

**Files:** Create `app/admin/motos/actions.ts` ; Test `tests/unit/admin-motos-actions.test.ts`.

- [ ] **Step 1:** Lire `app/admin/vehicules/actions.ts` (template, sur repo) ENTIER. Créer `tests/unit/admin-motos-actions.test.ts` : copie de `tests/unit/admin-vehicules-actions.test.ts` en adaptant : import `@/app/admin/motos/actions` (`createMoto`, `updateMoto`, `deleteMoto`) ; objet `base` aux champs moto (retirer `transmission`/`places`, ajouter `categorie: 'Roadster'`, `energie: 'Essence'`) ; `resourceType: 'moto'` dans les assertions audit ; doc id moto (`yamaha-mt07`) ; `revalidateTag('motos')` / `'moto:yamaha-mt07'`. Conserver les 9 cas (create ok/zod/non-admin, update concordant/conflit, delete soft, caracteristiques sans undefined, conflit sans audit, portes→**proprietaires** preserve — adapter : moto a `proprietaires` number mais PAS `portes`, garder seulement le test proprietaires).
- [ ] **Step 2:** Run `npx vitest run tests/unit/admin-motos-actions.test.ts` → FAIL (module introuvable).
- [ ] **Step 3:** Créer `app/admin/motos/actions.ts`, miroir de `app/admin/vehicules/actions.ts` avec deltas dans `parseForm` :
  - Retirer la lecture de `transmission`, `places`.
  - Ajouter `categorie: sanitize(formData.get('categorie'))` (champ requis, comme un enum string).
  - `caracEntries` (les strings filtrées `!== ''`) : retirer `co2`, `carrosserie`, `critAir` ; ajouter `poids` (string), `permis` (string). Garder puissance, cylindree, consommation, couleur, premiereCirculation, garantie.
  - Conserver le parsing numérique de `proprietaires` (number, posé si valide) ; retirer `portes` (n'existe pas sur moto).
  - `sanitize()` (fonction identique) appliqué à : id, marque, modele, categorie, description, reference.
  - Schema : `MotoSchema` (import `@/lib/schemas/moto`). `resourceType: 'moto'`. `revalidateTag('motos')` + `revalidateTag(\`moto:${data.id}\`)`. `redirect('/admin/motos')`. `writeAuditLog` POST-commit pour update (comme 4a corrigé).
  - Le reste (requireAdmin, optimistic lock transaction, FormActionState, soft delete `disponibilite:'vendu'`) : identique au template.
- [ ] **Step 4:** Run `npx vitest run tests/unit/admin-motos-actions.test.ts` → PASS (tous). `npx tsc --noEmit` → 0 err.
- [ ] **Step 5:** Commit `git add app/admin/motos/actions.ts tests/unit/admin-motos-actions.test.ts && git commit -m "feat(admin-motos): Server Actions create/update/delete + optimistic lock"`

---

## Task 5b : `components/admin/MotoForm.tsx`

**Files:** Create `components/admin/MotoForm.tsx`.

- [ ] **Step 1:** Lire `components/admin/VehiculeForm.tsx` (template) ENTIER. Créer `components/admin/MotoForm.tsx`, miroir avec deltas :
  - `Moto` au lieu de `Vehicule` (import `@/lib/motos`), actions `createMoto`/`updateMoto` (`@/app/admin/motos/actions`), `onSuccess` → `/admin/motos`, id généré `moto-${Date.now().toString(36)}`.
  - `<ImageUploader folder="motos" ...>` (folder supporté).
  - Retirer les champs `transmission`, `places`. Ajouter un `<select name="categorie">` (options : Roadster, Sport, Trail, Scooter, Custom, Routière) + `<FieldError name="categorie" />`.
  - `energie` select : options `Essence`, `Électrique` (pas Diesel/Hybride).
  - Fieldset caractéristiques : retirer co2/carrosserie/portes/critair ; ajouter `car_poids` (text), `car_permis` (`<select>` A1/A2/A/AM). Garder car_puissance, car_cylindree, car_consommation, car_couleur, car_premiere_circulation, car_garantie, car_proprietaires (number). **Les `name=` des inputs DOIVENT matcher exactement ce que `parseForm` de Task 4b lit.**
  - Legends fieldsets, classes responsive `grid-cols-1 sm:grid-cols-N`, `<p>` pour label Photos : identiques au template (déjà corrigés en 4a).
- [ ] **Step 2:** `npx tsc --noEmit` → 0 err. `npm run build` → succès.
- [ ] **Step 3:** Commit `git add components/admin/MotoForm.tsx && git commit -m "feat(admin-motos): MotoForm (FormShell + ImageUploader)"`

---

## Task 6b : Pages admin motos

**Files:** Create `app/admin/(shell)/motos/page.tsx`, `MotosTable.tsx`, `new/page.tsx`, `[id]/page.tsx`.

- [ ] **Step 1:** Lire les 4 fichiers template `app/admin/(shell)/vehicules/{page.tsx,VehiculesTable.tsx,new/page.tsx,[id]/page.tsx}`. Créer les 4 équivalents motos : remplacer `vehicule`→`moto`, `Vehicule`→`Moto`, `getVehicules`→`getMotos`, `VehiculeForm`→`MotoForm`, heading "Véhicules"→"Motos", liens `/admin/motos*`, `getByRole`/colonnes adaptées. Colonnes DataTable : marque+modèle, année, **catégorie** (à la place d'année seule si pertinent — garder marque/modèle, année, prix FR€, StatusBadge disponibilite, lien Éditer). Conserver le commentaire de dette fetch-all+find dans `[id]/page.tsx`. `MotosTable.tsx` = client wrapper (même raison Next 15 que VehiculesTable).
- [ ] **Step 2:** `npx tsc --noEmit` → 0 err. `npm run build` → succès, routes `/admin/motos`, `/admin/motos/new`, `/admin/motos/[id]` présentes.
- [ ] **Step 3:** Commit `git add "app/admin/(shell)/motos" && git commit -m "feat(admin-motos): pages liste / new / edit"`

---

## Task 7b : ISR public `/vente-moto`

**Files:** Create `lib/data/motos-cache.ts` ; Modify `app/vente-moto/page.tsx`, `app/vente-moto/[id]/page.tsx`, `app/vente-moto/VenteMotoClient.tsx`.

- [ ] **Step 1:** Créer `lib/data/motos-cache.ts`, miroir de `lib/data/vehicules-cache.ts` :

```typescript
import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { Moto } from '@/lib/motos';

export const getCachedMotos = unstable_cache(
  async (): Promise<Moto[]> => {
    const adapter = await getAdapter();
    return adapter.getMotos();
  },
  ['motos-public'],
  { tags: ['motos'] }
);
```

- [ ] **Step 2:** Lire `app/vente-vehicule/page.tsx` + `[id]/page.tsx` + `VenteVehiculeClient.tsx` (templates post-merge, incluant les fixes 4a). Appliquer le MÊME pattern à `/vente-moto` :
  - `app/vente-moto/page.tsx` : async, `await getCachedMotos()`, passe `motos` en prop à `<VenteMotoClient>`, `export const revalidate = 3600`, generateMetadata préservé. Vérifier qu'il n'y a pas déjà un `export const dynamic` en conflit.
  - `app/vente-moto/VenteMotoClient.tsx` : remplacer `import { MOTOS }` par prop `{ motos }: { motos: Moto[] }`, usages `MOTOS`→`motos`, ajouter `motos` aux deps useMemo. Filtres UI préservés à l'identique.
  - `app/vente-moto/[id]/page.tsx` : `generateStaticParams` via `await import('@/lib/data')` → `getMotos()` (PAS getCachedMotos — leçon 4a) ; `generateMetadata` + Page via `getCachedMotos()` + find ; `notFound()` préservé ; `export const revalidate = 3600` ; commentaire défensif notFound ISR ; props enfants (FinancementMotoSimulator, MotoGallery) INCHANGÉES.
- [ ] **Step 3:** `npx tsc --noEmit` → 0 err. `rm -rf .next && npm run build` → succès, `/vente-moto/[id]` route SSG présente.
- [ ] **Step 4:** Vérif empirique (leçon 4a — prouver, pas supposer). `.env.local` force FirebaseAdapter cloud (vide) : déplace-le temporairement pour tester StaticAdapter (`mv .env.local .env.local.bak`, build, test, `mv` retour SANS FAUTE). `PORT=3200 npx next start &` ; curl les 7 ids moto (`yamaha-mt07 honda-cb500x kawasaki-z900 piaggio-mp3-500 bmw-r1250gs honda-pcx-125-neuf yamaha-tracer-9-neuf`) → 7×200 attendu ; `curl /vente-moto | grep -c vente-moto/` > 1. Tuer le serveur. Restaurer `.env.local` (vérifier `ls -la .env.local`).
- [ ] **Step 5:** Commit `git add lib/data/motos-cache.ts app/vente-moto && git commit -m "feat(motos): pages publiques SSG→ISR via unstable_cache + revalidateTag"`

---

## Task 8b : Seed motos Firestore

**Files:** Modify `scripts/seed-firestore.ts`.

- [ ] **Step 1:** Lire `scripts/seed-firestore.ts`. Il seed products puis vehicules (bloc `VEHICULES`). Ajouter un bloc `motos` identique au bloc vehicules : import dynamique `const { MOTOS } = await import('../lib/motos');`, `parseMoto` (import `@/lib/schemas/moto` ou chemin relatif cohérent avec le script), `clearCollection('motos')`, batch `db.collection('motos').doc(validated.id).set(validated)`, logs style existant (🏍️). Enrichir `metadata/stats` additivement (`motosCount`, `motosDisponibles`) SANS retirer les compteurs produits/véhicules existants. Le bloc motos APRÈS le commit du batch véhicules.
- [ ] **Step 2:** `npx tsc --noEmit` → 0 err. Test empirique émulateur : `npx firebase emulators:start --only firestore --project demo-gp-parts &` ; `sleep 8` ; `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-firestore.ts` → log products + vehicules + 7 motos sans erreur ; vérifier `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node -e "..."` → `motos count: 7`, vehicules toujours 7, products intacts. Tuer l'émulateur.
- [ ] **Step 3:** Commit `git add scripts/seed-firestore.ts && git commit -m "feat(motos): seed Firestore motos (étend seed-firestore)"`

> `storage.rules` couvre déjà `motos/` (vérifié), `firebase.json` storage déjà configuré : AUCUNE modif infra.

---

## Task 9b : E2E motos

**Files:** Create `tests/e2e/vente-moto-public.spec.ts`, `tests/e2e/admin-motos.spec.ts`.

- [ ] **Step 1:** Lire `tests/e2e/vente-vehicule-public.spec.ts` + `tests/e2e/admin-vehicules.spec.ts` (templates, incluant fixes 4a : pas de h1 HERO trompeur, helper login réel `injectSessionCookie`). Créer les 2 équivalents motos :
  - `vente-moto-public.spec.ts` : `goto('/vente-moto')`, `toHaveURL(/\/vente-moto$/)`, assertion critique `locator('a[href^="/vente-moto/"]').first()` visible (anti-régression catalogue non vide), test fiche : click → URL `/vente-moto/.+` + h1 visible.
  - `admin-motos.spec.ts` : réutiliser EXACTEMENT le helper `injectSessionCookie` + gating `HAS_AUTH_CREDENTIALS` du template. Tests : `/admin/motos` heading "Motos" + lien Nouveau ; `/admin/motos/new` form (getByLabel champs réels du MotoForm — vérifier les labels exacts : "Marque", "Prix (€)", bouton "Créer la moto" ou texte réel du SubmitButton) ; édition `/admin/motos/yamaha-mt07` → `getByLabel('Marque')` `toHaveValue('Yamaha')`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0 err. `npx playwright test tests/e2e/vente-moto-public.spec.ts tests/e2e/admin-motos.spec.ts --list` → tests collectés sans erreur. Si exécutable localement (StaticAdapter forcé), run le public → 2/2 PASS.
- [ ] **Step 3:** Commit `git add tests/e2e/vente-moto-public.spec.ts tests/e2e/admin-motos.spec.ts && git commit -m "test(admin-motos): E2E flow admin + anti-régression pages publiques"`

---

## Task 10b : Audit qualité + PR

- [ ] **Step 1:** `npx tsc --noEmit` (0 err) · `npm run lint` (0 warn) · `npx prettier --check $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx)$' | tr '\n' ' ')` (clean) · `npx vitest run` (0 régression, baseline 248 + nouveaux) · `npm run build` (succès).
- [ ] **Step 2:** Corriger toute régression avant de continuer (impact-map manqué = réparer, pas désactiver).
- [ ] **Step 3:** `git push -u origin feat/admin-cms-phase4b-motos` + `gh pr create` (titre `feat(admin-cms): Phase 4b — CRUD motos`, body : miroir 4a, deltas Moto, vérif empirique, lien design doc).
- [ ] **Step 4:** Attendre CI verte (job principal + E2E) avant merge. Règle d'or.

---

## Self-Review

**Couverture :** Phase 4b miroir intégral de 4a (Tasks 1-10) + deltas Moto explicités (categorie, energie enum, poids/permis, sans transmission/places/co2/carrosserie/portes/critAir). Task 3b/storage/ImageUploader : explicitement no-op (déjà fait).

**Placeholders :** aucun. Les "lire le template sur le repo" pointent vers des fichiers mergés réels (DRY — ne pas re-transcrire 300 lignes, lire le code validé). Deltas chiffrés (dates fixtures, enums, champs).

**Cohérence types :** `Moto` (Task 1b +updatedAt) ↔ `MotoSchema` (2b miroir) ↔ `parseForm` motos (4b) ↔ `MotoForm` name= (5b) ↔ pages (6b) ↔ `getCachedMotos` tag `motos` ↔ `revalidateTag('motos')` (4b) ↔ seed (8b) ↔ E2E (9b). Chaîne fermée, identique à 4a validée.

**Leçons 4a :** les 3 escalades (assertDevFallback, unstable_cache dans generateStaticParams, Firestore undefined) sont pré-résolues et explicitées dans le plan → exécution 4b sans re-escalade attendue.
