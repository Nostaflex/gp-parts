# Feature flags de sections — pilotage de visibilité depuis le back-office

> Spec — 2026-06-27. Statut : validé (design), à implémenter.

## Contexte & objectif

GP Parts comporte plusieurs sections publiques (Pièces, Location, Vente
véhicule, Vente moto, Réparation). Pour un **lancement progressif**, on veut
pouvoir activer / désactiver chaque section depuis le back-office, sans
redéploiement, et de façon **réellement étanche** (« vraie porte fermée » :
section invisible _et_ inaccessible tant qu'elle n'est pas activée).

Cas d'usage immédiat : lancer le site avec **uniquement Vente véhicule**
visible, puis rallumer les autres sections au fur et à mesure que Stéphane
est prêt.

### Sections concernées

| Section                      | Flaggable ?                             | Routes                                    |
| ---------------------------- | --------------------------------------- | ----------------------------------------- |
| Vente véhicule               | ❌ toujours visible (cœur du lancement) | `/vente-vehicule`, `/vente-vehicule/[id]` |
| Contact / À propos / légales | ❌ toujours visibles (support)          | `/contact`, `/a-propos`, …                |
| **Pièces**                   | ✅                                      | `/pieces`, `/pieces/[slug]`               |
| **Location**                 | ✅                                      | `/location`                               |
| **Vente moto**               | ✅                                      | `/vente-moto`, `/vente-moto/[id]`         |
| **Réparation**               | ✅                                      | `/reparation`                             |

## Non-objectifs (YAGNI)

- Pas de planification temporelle (« activer le 1er juillet »). Toggle manuel.
- Pas de flags par produit / par utilisateur. Granularité = section uniquement.
- Pas de A/B testing ni rollout %. ON/OFF binaire.
- Vente véhicule et pages support ne sont **pas** flaggables.

## Architecture

### 1. Data model — Firestore `meta/featureFlags`

Document unique, cohérent avec le pattern existant `meta/admins` :

```ts
// meta/featureFlags
{
  pieces: boolean,
  location: boolean,
  venteMoto: boolean,
  reparation: boolean,
  updatedAt: number,   // Date.now() au dernier toggle
  updatedBy: string,   // email admin (traçabilité)
}
```

Défaut si le doc est absent → constante dans `lib/config.ts` :

```ts
export const DEFAULT_FEATURE_FLAGS = {
  pieces: true,
  location: true,
  venteMoto: true,
  reparation: true,
} as const;
```

> Défaut = tout ON, pour qu'une lecture sur un Firestore non seedé ne casse
> jamais le site existant. Le **seed de lancement** (ci-dessous) pose
> explicitement l'état désiré.

### 2. Lecture cachée — `lib/data/feature-flags-cache.ts`

Même pattern que `getCachedVehicules` (`unstable_cache`, invalidation par tag) :

```ts
export const getCachedFeatureFlags = unstable_cache(
  async (): Promise<FeatureFlags> => {
    const adapter = await getAdapter();
    return adapter.getFeatureFlags(); // merge avec DEFAULT_FEATURE_FLAGS
  },
  ['feature-flags'],
  { tags: ['feature-flags'] }
);
```

- `DataAdapter.getFeatureFlags()` ajouté à `lib/data/types.ts`.
- `StaticAdapter` → renvoie `DEFAULT_FEATURE_FLAGS` (mode dev sans Firebase).
- `FirebaseAdapter` → lit `meta/featureFlags`, merge sur les défauts.

### 3. Points de garde (5 par section OFF)

Pour qu'une section OFF soit « vraie porte fermée » :

1. **Nav header** — `components/cp/CpHeader.tsx` (`NAV_LINKS`, L9) : filtrer
   les liens selon les flags (desktop L87 + mobile L162). Les flags arrivent
   par prop depuis un parent server (le header est client : scroll/dark
   sections), donc le layout storefront lit `getCachedFeatureFlags()` et passe
   `visibleSections` au header.
2. **Homepage** — `components/cp/CpUniversStrip.tsx` (`UNIVERS`, L6) : filtrer
   les tuiles d'univers selon les flags.
3. **Footer** — `components/cp/CpFooter.tsx` : filtrer le groupe liens sections
   (L20–23) + le groupe « Pièces » (L41–44).
4. **Routes** — `notFound()` en tête de chaque `page.tsx` de section flaggée
   (+ sous-routes `[slug]` / `[id]`) si le flag est OFF → vrai 404.
5. **Sitemap** — `app/sitemap.ts` : exclure les entrées statiques **et**
   dynamiques (produits pour Pièces, motos pour Vente moto) des sections OFF.

> Vente véhicule, Contact, À propos, légales ne sont jamais filtrés.

### 4. Page back-office — `/admin/(shell)/parametres`

- **Server component** : lit `getAdminFirestore()` → état courant des 4 flags.
- **UI** : 4 interrupteurs iOS (design system back-office « iOS Clarity »
  existant — toggles `--blue`/`--green`), un par section flaggable, avec libellé
  et état. Pas de mix avec Volcanic Clarity (storefront).
- **Server action** `toggleFeatureFlags(flags)` :
  1. `requireAdmin()` (auth + whitelist),
  2. `set(..., { merge: true })` sur `meta/featureFlags` (+ `updatedAt`/`updatedBy`),
  3. `writeAuditLog({ action: 'update', resourceType: 'feature-flags', diff })`,
  4. `revalidateTag('feature-flags')` + `revalidatePath('/', 'layout')`
     (rafraîchit nav + home + footer).

### 5. Cache & SEO

Les pages storefront sont ISR/statiques. Le tag `'feature-flags'` invalidé au
toggle régénère nav, homepage, footer, routes de section et sitemap. **Aucun
redéploiement**. Les sections OFF disparaissent du sitemap → désindexation
Google propre ; l'accès direct par URL renvoie 404.

## Seed de lancement

État initial visé (lancement « Vente véhicule seule ») :

```
pieces=false, location=false, venteMoto=false, reparation=false
```

Posé soit via un script `scripts/seed-feature-flags.ts` (pattern
`seed-admin-whitelist.ts`), soit via la page BO au premier login de Stéphane.

## Stratégie de test

- **Unit**
  - `getCachedFeatureFlags` : défaut quand doc absent, merge correct quand présent.
  - Filtrage `NAV_LINKS` / `UNIVERS` / liens Footer selon flags.
  - `StaticAdapter.getFeatureFlags` → défauts.
- **Action**
  - `toggleFeatureFlags` : refuse sans admin, écrit le doc, écrit l'audit,
    appelle `revalidateTag`.
- **E2E (Playwright)**
  - Section OFF → absente du header, de la home, du footer ; `/section` = 404.
  - Section ON → réapparaît aux 3 endroits + route 200.
- **Anti-régression**
  - Vente véhicule / Contact / À propos toujours présents quels que soient les flags.

## Impact-map

- **Touche** : `lib/config.ts`, `lib/data/{types,static,firebase}.ts`,
  nouveau `lib/data/feature-flags-cache.ts`, `components/cp/{CpHeader,
CpUniversStrip,CpFooter}.tsx`, layout storefront, `app/sitemap.ts`,
  `page.tsx` des 4 sections (+ sous-routes), nouvelle page
  `app/admin/(shell)/parametres/` + action, `firestore.rules` (lecture
  publique `meta/featureFlags`, écriture admin), Firestore `meta/featureFlags`.
- **Casse potentiellement** : tests snapshot nav/footer/home (liens filtrés) ;
  tests sitemap (entrées conditionnelles). À mettre à jour.
- **Doit préserver** : Vente véhicule / support toujours visibles ; aucun
  redéploiement requis pour flipper ; règles Firestore (lecture publique des
  flags, écriture admin seulement) ; design systems non mixés.

## Règles Firestore

Ajouter dans `firestore.rules` (le doc `meta/featureFlags` doit être lisible
publiquement pour le rendu storefront, écrit par admin seulement) :

```
match /meta/featureFlags {
  allow read;                 // storefront lit les flags
  allow write: if isAdmin();  // toggle BO seulement
}
```

> Note : l'écriture passe par l'Admin SDK (`getAdminFirestore`) qui contourne
> les rules ; la règle `write: if isAdmin()` est une défense en profondeur
> pour bloquer toute écriture client directe.
