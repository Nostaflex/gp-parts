# Admin CMS v3 — Phase 4a : CRUD Véhicules — Design

> Statut : **approuvé** (brainstorming 2026-05-17). Précède le plan d'implémentation.
> Chantier parent : `docs/architecture/2026-05-14-admin-cms-v2.md` §Phase 4 (L644-655).
> Prérequis : Phase 3 mergée (#20, `requireAdmin` + `writeAuditLog` + `getAdminFirestore` + DataAdapter étendu).

## 1. Objectif & périmètre

Le back-office crée / édite / supprime (soft) les véhicules d'occasion en
Firestore. Les pages publiques `/vente-vehicule` reflètent les changements
via ISR (`revalidateTag`).

**Phase 4a = véhicules seuls.** Les motos (Phase 4b) réutiliseront le même
pattern dupliqué, après validation de l'approche sur les véhicules.

### Dans le périmètre

```
ÉCRITURE (back-office, protégé requireAdmin — Phase 3)
  lib/schemas/vehicule.ts            Zod : valide form ET doc Firestore
  app/admin/vehicules/actions.ts     'use server' : create / update / delete (soft)
  app/admin/vehicules/page.tsx       liste + bouton « Nouveau »
  app/admin/vehicules/[id]/page.tsx  édition
  app/admin/vehicules/new/page.tsx   création
  components/admin/VehiculeForm.tsx  ~20 champs, monté dans FormShell (P2)

LECTURE (public, ISR)
  lib/vehicules.ts                       + champ updatedAt au type Vehicule
  app/vente-vehicule/page.tsx            SSG → ISR via getAdapter().getVehicules()
  app/vente-vehicule/[id]/page.tsx       idem, generateStaticParams depuis Firestore

SEED
  scripts/seed-vehicules-firestore.ts    migre les 7 VEHICULES → Firestore (idempotent)

INFRA
  firebase.json                          + section storage (rules)
  firebase.storage.rules                 read public, write if isAdmin()
```

### Hors périmètre (YAGNI / autres phases)

- Motos (Phase 4b), produits (Phase 5), demandes (Phase 6).
- Champ `deletedAt` dédié : soft delete = `disponibilite='vendu'` (champ
  existant, pages publiques filtrent déjà).
- Versioning / historique : `audit_log` (Phase 3) suffit.

### Dépendances

`browser-image-compression@2.0.2` **déjà installé**. `storageBucket`
**déjà configuré** dans `lib/firebase.ts`. **Zéro nouvelle dépendance** —
la contrainte v3.1 « zéro nouvelle dép » est respectée (vérifié, pas supposé).

### Réutilisation P2 (vérifié — rien de recréé)

- `components/admin/ImageUploader.tsx` : **déjà complet**. API
  `<ImageUploader folder="vehicules" entityId={id} value={images}
onChange={…} max={5} />`. Compression WebP 2000px/q0.85, upload Firebase
  Storage resumable, path déterministe anti-orphelin, slots progression/erreur.
- `components/admin/FormShell.tsx` : wrapper Server Action via
  `useActionState`, `FieldError` (Zod inline), `SubmitButton` (pending).
  Type `FormActionState` à respecter par les Server Actions.
- `DataTable`, `StatusBadge`, `ConfirmDialog`, `EmptyState` : réutilisés.

### Impact-map

Ajout `updatedAt: string` au type `Vehicule` casse : les 7 fixtures
`VEHICULES`, `getVehiculeById`, `generateStaticParams`, `VenteVehiculeClient`,
les pages publiques. À traiter en un lot dans le plan ; E2E pages publiques
en garde-fou anti-régression.

## 2. Schemas Zod, données, Storage

### `lib/schemas/vehicule.ts`

Source unique de validation (form ET doc Firestore — pattern
`lib/schemas/product.ts`). `parseVehicule(doc)` throw si corruption.

```
VehiculeSchema = z.object({
  id: string().min(1),
  type: enum(['occasion','neuf']),
  marque: string().min(1),
  modele: string().min(1),
  annee: number().int().min(1990).max(currentYear+1),
  km: number().int().min(0),
  energie: enum(['Essence','Diesel','Hybride']),
  transmission: string().min(1),
  places: number().int().min(1).max(9),
  options: array(string()),
  prix: number().int().min(0),        // EUROS entiers (convention Vehicule existante — PAS centimes)
  mensualite: number().int().min(0),
  image: string().url(),              // = images[0], dérivé
  images: array(string().url()).min(1).max(5),
  description: string().min(1),
  caracteristiques: CaracteristiquesSchema,  // tous champs optionnels
  reference: string().min(1),
  disponibilite: enum(['disponible','reserve','vendu']),
  updatedAt: string(),                // ISO — NOUVEAU, optimistic lock
})
```

> Convention prix : `Vehicule.prix` est en **euros entiers** (`18900` =
> 18 900 €), contrairement à `Product.price` en centimes. Convention
> existante, **préservée** — ne pas « corriger ».

### Type `Vehicule`

Ajout `updatedAt: string` (ISO). Les 7 fixtures `VEHICULES` reçoivent un
`updatedAt` (date au seed).

### Firestore

Collection `vehicules/` (déjà déclarée Phase 3 dans `FirebaseAdapter`).
Doc ID = `vehicule.id` (slug-like, ex `peugeot-308sw`), généré client-side
avant upload photos (path Storage déterministe → 0 orphelin).

### Firebase Storage

- Path : `vehicules/{vehiculeId}/photo-{index}.webp` (géré par
  `ImageUploader` P2).
- `firebase.storage.rules` : `read` public, `write if isAdmin()` (réutilise
  le helper rules Phase 3).
- `firebase.json` : ajouter section `storage`.

### Optimistic lock

`updateVehicule` lit le doc en transaction, compare `updatedAt` serveur vs
`updatedAt` client (champ caché du form). Mismatch → `AdminError(409,
« Véhicule modifié entre-temps, rechargez »)`. Sinon update +
`updatedAt = now`.

## 3. Server Actions

`app/admin/vehicules/actions.ts` (`'use server'`). Pattern spec L308-343 +
Server Action existante `app/(boutique)/(checkout)/commande/actions.ts`.
État de retour conforme `FormActionState` (P2).

```
createVehicule(prevState, formData) → { ok } | { errors }
  1. requireAdmin()                                   // Phase 3
  2. VehiculeSchema.safeParse(formData)               // → { errors } si invalide
  3. id repris du champ caché (photos déjà uploadées dessus)
  4. getAdminFirestore().doc(`vehicules/${id}`).set({ ...data, updatedAt: now })
  5. writeAuditLog({ actor, action:'create', resourceType:'vehicule', resourceId:id })
  6. revalidateTag('vehicules')
  7. redirect('/admin/vehicules')

updateVehicule(prevState, formData) → { ok } | { errors } | { conflict }
  1. requireAdmin()
  2. safeParse
  3. runTransaction:
       before = tx.get(ref)
       SI before.updatedAt !== formData.updatedAt → AdminError(409)
       tx.update(ref, { ...data, updatedAt: now })
       writeAuditLog({ action:'update', diff: computeDiff(before, data) })
  4. revalidateTag('vehicules') + revalidateTag(`vehicule:${id}`)

deleteVehicule(id) → { ok }                            // SOFT
  1. requireAdmin()
  2. doc.update({ disponibilite:'vendu', updatedAt:now })   // jamais hard delete
  3. writeAuditLog({ action:'delete', resourceType:'vehicule', resourceId:id })
  4. revalidateTag('vehicules')
```

### Décisions

- **Écriture = Admin SDK** (`getAdminFirestore`, Phase 3), bypass Security
  Rules avec privilège service account. Sécurité garantie en amont par
  `requireAdmin()` — aucune écriture sans.
- **`computeDiff(before, after)`** : helper local (~15 LOC), champs changés
  `{before, after}` pour l'audit log, testable isolément.
- **Photos uploadées avant submit** (côté `ImageUploader`, client). Le
  `formData` ne contient que les URLs finales ; l'action ne touche pas
  Storage. Path déterministe par ID → ré-upload écrase, pas d'orphelin.
- **`revalidateTag`** : `'vehicules'` (listes) + `'vehicule:${id}'` (fiche).

### Erreurs

Zod → `{ errors: fieldErrors }` inline form. `AdminError` (401/403/409) →
catch dans le form client, message FR. Firestore down → `AdminError(500)`

- log stderr (pattern Phase 3).

## 4. Pages & UI

Design system **iOS Clarity** (back-office). Page dédiée (form lourd, spec
L353 — pas drawer).

- **`/admin/vehicules/page.tsx`** (Server Component) : `getAdapter()
.getVehicules()` → `DataTable` (P2). Colonnes : miniature · marque/modèle
  · année · prix · `disponibilite` (`StatusBadge` P2) · actions. Bouton
  « + Nouveau » → `/new`. Ligne → `/[id]`.
- **`/admin/vehicules/new/page.tsx`** + **`[id]/page.tsx`** : même
  `<VehiculeForm>`, mode `create` vs `edit` (prop `initial?: Vehicule`).
  `[id]` : find by id, `notFound()` si absent.
- **`components/admin/VehiculeForm.tsx`** (client) : monté dans `FormShell`
  (P2, `useActionState`). ~20 champs en sections : _Identité_ / _Technique_
  / _Commercial_ / _Contenu_. Champ caché `updatedAt` (edit). `FieldError`
  par champ. `disponibilite` = segmented control (pas dropdown — spec UI
  back-office). Photos via `<ImageUploader folder="vehicules">` (P2, tel
  quel).
- **Suppression** : `ConfirmDialog` (P2) → « Marquer comme vendu ? » (soft).

## 5. Tests, vérification, risques

### Tests (TDD strict)

| Cible                        | Type                                                            | Cas                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/schemas/vehicule.ts`    | Vitest unit                                                     | parse valide ; rejette annee hors borne, images>5, prix négatif, champ manquant                                                                |
| `computeDiff()`              | Vitest unit                                                     | champs changés, ignore inchangés, objets imbriqués (caracteristiques)                                                                          |
| Server Actions               | Vitest unit (Firestore mocké, pattern `admin-audit.test.ts` P3) | create OK ; update conflit `updatedAt` (409) ; delete soft `disponibilite:'vendu'` ; non-admin rejeté ; audit log écrit ; revalidateTag appelé |
| `StaticAdapter.getVehicules` | Vitest unit                                                     | fixtures ont `updatedAt` (régression type)                                                                                                     |
| Pages publiques              | E2E Playwright                                                  | liste + fiche `[id]` rendues (anti-régression live)                                                                                            |
| Flow admin                   | E2E Playwright                                                  | login → new → submit → liste → edit → soft delete (spec étape 10)                                                                              |

Mock Firestore Admin : pattern `tests/unit/admin-audit.test.ts` (Phase 3).

### Vérification avant merge

`tsc 0 err` · `lint 0 warn` · suite complète **0 régression** (baseline 223
post-Phase 3) · `build OK` · **CI verte (job principal + E2E) avant merge**
— règle d'or roadmap (pas de phase N+1 si CI rouge).

### Risques

| Risque                                                          | Mitigation                                                                                                                                                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updatedAt` casse pages publiques SSG                           | Migration type + 7 fixtures en 1 lot ; E2E public garde-fou                                                                                                                                                      |
| SSG→ISR : Firestore client SDK pas nativement `fetch`-cacheable | Décision figée : `unstable_cache(() => getAdapter().getVehicules(), ['vehicules'], { tags: ['vehicules'] })` côté Server Component. `revalidateTag('vehicules')` purge ce cache. Test rendu public en garde-fou. |
| Seed relancé double-écrit                                       | Idempotent (`.set()` par ID = upsert, comme `setup-ttl-policies` P3)                                                                                                                                             |
| Storage rules non déployées → upload 403 prod                   | `firebase.json` storage + `firebase deploy --only storage:rules` documenté dans le plan                                                                                                                          |
| Photos orphelines si submit échoue post-upload                  | Path déterministe par ID (`ImageUploader` P2 le gère) — résiduel nul                                                                                                                                             |

### Découpage PR

1 PR `feat/admin-cms-phase4-vehicules`. Commits logiques : (1)
schema+type+fixtures migration, (2) Server Actions+tests, (3)
pages+VehiculeForm, (4) ISR public+seed, (5) E2E. Squash merge (cohérent
historique chantier).

### Estimation

Spec : 3j. `ImageUploader`/`FormShell` déjà faits (P2) → **~1,5j** réel.
