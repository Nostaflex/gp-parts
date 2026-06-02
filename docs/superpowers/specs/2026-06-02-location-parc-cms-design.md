# Location — Back-office du parc (sous-projet A)

> Statut : **Approuvé** (2026-06-02). Projet : GP Parts. Branche : `feat/location-parc-cms`.

## Contexte

La page storefront `/location` (location de voitures en Guadeloupe) affiche un
parc **codé en dur** : `const VEHICULES = [...]` dans
`app/location/LocationClient.tsx`. Aucun back-office, aucun modèle de données,
aucune persistance. Stéphane ne peut pas gérer son parc.

Demande utilisateur : pouvoir **créer / éditer / supprimer** les voitures de
location depuis l'admin, et que `/location` reflète ces données.

## Découpage (rappel)

Le besoin complet « parc + réservations + calendrier » est découpé en 3
sous-projets construits dans l'ordre :

- **A — Parc (cette spec)** : entité `LocationCar` + CRUD admin + câblage storefront.
- **B — Réservations** : persistance du formulaire `/location` (aujourd'hui factice) + email + liste admin.
- **C — Calendrier + disponibilité** : affectation voiture, calendrier, blocage périodes, anti-double-booking.

B dépend de A (les voitures doivent exister en données). C dépend de A+B.

## Périmètre de A

CRUD du parc de location, **patron identique** au CRUD véhicules de vente
(Phase 4) : même structure de fichiers, mêmes garde-fous (requireAdmin, Zod,
audit log, optimistic lock, soft-delete, revalidation).

**Hors périmètre A** (→ B/C) : réservations, calendrier, disponibilité par
dates. Le champ `disponible` de A est un booléen global (la voiture est-elle
proposée à la location, oui/non), pas une disponibilité par période.

## Décision : pas de réutilisation de l'entité `Vehicule` (vente)

Vente et location ont des champs, un pricing et un cycle de vie différents
(prix jour/semaine vs mensualité+km, catégorie location vs énergie/Crit'Air).
Réutiliser `Vehicule` avec un flag `forRent` coupinerait deux concepts
distincts. → **Entité dédiée `LocationCar`.**

## Modèle de données — `lib/location-cars.ts`

Modèle **lean** : exactement les champs utilisés par `/location`, plus
`reference`/`updatedAt` (patron véhicules). Prix en **centimes** (convention
projet, jamais de float).

```ts
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
  disponible: boolean; // dispo globale (le calendrier viendra en C)
  image: string;
  reference: string; // tracking admin
  updatedAt: string; // ISO — optimistic lock + tri admin
};
```

Le seed initial (`LOCATION_CARS`) reprend les voitures actuellement codées en
dur dans `LocationClient.tsx`, prix convertis en centimes.

Firestore : collection `location-cars`, soft-delete via `deletedAt: null`
(cohérent produits/véhicules — le champ n'est pas dans le type lu, géré au
niveau document comme les autres entités).

## Schéma Zod — `lib/schemas/location-car.ts`

- `locationCarSchema` (lecture, tolérant) + `LocationCarWriteSchema` (écriture stricte).
- Contraintes : `marque`/`modele` non vides (max 60), `categorie` enum,
  `places` int 1–9, `prix*EnCents` int ≥ 0, `image` string, `reference` non vide.
- `parseLocationCar(data)` pour la lecture Firestore (mirror `parseOrder`/véhicules).

## Adapter — `lib/data/{types,static,firebase}.ts`

Interface `DataAdapter` (+ Static + Firebase) :

```ts
getLocationCars(opts?: { includeDeleted?: boolean }): Promise<LocationCar[]>;
getLocationCarById(id: string): Promise<LocationCar | null>;
```

- `FirebaseAdapter` : lit la collection `location-cars`, exclut `deletedAt != null`
  (sauf `includeDeleted`), parse via `parseLocationCar`.
- `StaticAdapter` : renvoie le seed `LOCATION_CARS` (dev/test sans Firestore).
- Les **écritures** ne passent PAS par l'adapter : server actions via Admin SDK
  (patron véhicules), pour rester cohérent avec le reste de l'admin.

## CRUD admin

Patron exact de `app/admin/(shell)/vehicules/` :

- Routes : `/admin/location` (liste), `/admin/location/new`, `/admin/location/[id]`.
- `app/admin/location/actions.ts` : `createLocationCar` / `updateLocationCar` /
  `deleteLocationCar`. Chaque action : `requireAdmin()` en 1ère ligne →
  `LocationCarWriteSchema.safeParse` → écriture Firestore Admin SDK
  (transaction pour create/unicité id, optimistic lock via `updatedAt` pour
  update/delete) → `writeAuditLog` post-commit → `revalidateTag('location-cars')`
  - `revalidatePath('/location')`.
- `deleteLocationCar` : soft-delete (`deletedAt`), comme produits.
- `components/admin/LocationCarForm.tsx` : réutilise `FormShell` + `ImageUploader`
  (ajout de `'location'` au type `folder`). Prix saisis en euros → convertis en
  centimes côté action (patron `ProductForm`/produits).

## Sidebar admin

Ajout d'un item « Location » dans la section **Catalogue** de
`components/admin/AdminSidebar.tsx`, `enabled: true`, href `/admin/location`,
icône `CarFront` (lucide).

> Note : cette PR corrige aussi un bug indépendant déjà repéré dans la sidebar —
> lien Pièces `/admin/produits` → `/admin/products` (404), et activation des
> items Pièces/Véhicules/Motos (`enabled: true`).

## Câblage storefront

`app/location/page.tsx` (Server Component) :

- lit `adapter.getLocationCars()`, filtre `disponible === true`,
- passe les voitures en props à `LocationClient`.

`LocationClient.tsx` :

- **suppression** du `const VEHICULES` codé en dur ; les voitures arrivent en props,
- prix affichés via `formatPrice()` (centimes → €) au lieu des nombres bruts,
- le reste (filtres catégorie, formulaire de réservation factice) **inchangé**
  pour A — la réservation sera corrigée en B.

## Tests

- **Unit** : `LocationCarWriteSchema` (validations + rejets), `parseLocationCar`,
  StaticAdapter seed (`getLocationCars` / `getLocationCarById`), server actions
  (mirror `tests/unit/vehicules*` + `data-adapter`). Conversion euros→centimes.
- Pas d'E2E nouveau pour A (storefront rendu depuis l'adapter ; le smoke admin
  existant couvre la navigation).
- **Gate CI** : suite unit verte (416+), typecheck, lint 0 nouveau, build vert.

## Migration / seed

Décision : **seed automatique**. Un script one-shot
(`scripts/seed-location-cars.ts` ou équivalent) pousse les voitures du seed
`LOCATION_CARS` dans la collection Firestore `location-cars` (idempotent : skip
si l'id existe déjà). Le nettoyage des données de démo se fera lors du vrai
lancement prod (hors périmètre A).

## Definition of Done

- [ ] `lib/location-cars.ts` (type + seed `LOCATION_CARS`).
- [ ] `lib/schemas/location-car.ts` (read tolérant + write strict).
- [ ] Adapter : `getLocationCars` / `getLocationCarById` (interface + Static + Firebase).
- [ ] Server actions create/update/delete (requireAdmin, Zod, audit, optimistic lock, soft-delete).
- [ ] Routes admin `/admin/location` + `/new` + `/[id]` + `LocationCarForm`.
- [ ] Sidebar : item Location (+ fix lien Pièces 404 + enabled catalogue).
- [ ] `/location` storefront lit l'adapter ; `const VEHICULES` supprimé ; prix via `formatPrice`.
- [ ] Script de seed Firestore.
- [ ] Tests unit verts + typecheck + lint + build.
