# Admin CMS Phase 5 — CRUD Produits — Design (durci sécurité)

> **Statut :** Design validé (brainstorming) — prêt pour writing-plans.
> **Date :** 2026-05-18.
> **Prérequis mergés :** Phase 3 (`requireAdmin` + audit + DataAdapter, #20), Phase 4a véhicules (#21), Phase 4b motos (#22), **P0 sécurité (#23, `8b43c60`)** — `safeJsonLd` + `requireAdmin()` sur `/api/admin/*`.
> **Posture :** site e-commerce public sur Internet, 1 admin (Stéphane, mobile, non-technique), 1 dev. Objectif explicite du propriétaire : **robuste, résistant aux attaques**. Right-sizing : contrôles qui stoppent l'exploitation réelle d'un CRUD admin public — pas de machinerie SOC2.

Phase 5 applique le pattern CRUD admin établi en 4a/4b au type `Product`, **avec les divergences `Product` vs `Vehicule`/`Moto`** et un durcissement sécurité issu d'un threat model recherche-backé (OWASP 2025, Next.js 15 Server Actions, Firebase Admin SDK / Firestore rules).

---

## 1. Décisions verrouillées (avec verdict threat model)

| #   | Décision                                                                                    | Verdict           | Conséquence                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Full mirror 4a/4b + rewire catalogue public (`app/(boutique)/pieces/`) statique→adapter/ISR | **KEEP + HARDEN** | Ne PAS copier le pattern route API non-gated ; chaque importeur statique `PRODUCTS` = checklist de migration avec test de fuite                                                              |
| 2   | Soft-delete via champ dédié `Product.deletedAt?: string` (ISO)                              | **KEEP + HARDEN** | `deletedAt` server-only, **absent du schéma d'input** ; mis seulement par `deleteProduct` ; restore = action séparée explicite                                                               |
| 3   | `compatibility[]` édité via lignes répétables dynamiques (`compat_{i}_*`)                   | **KEEP + HARDEN** | `.max(50)` + bornes champs + reconstruction **dense bornée** (jamais indexée par l'index max soumis)                                                                                         |
| 4   | Filtrage `deletedAt` « chokepoint unique adapter »                                          | **REMPLACÉE**     | Prémisse fausse : `FirebaseAdapter` = **client SDK**, les `firestore.rules` sont dans le path de lecture, et les lectures by-key bypassent un filtre de liste. → architecture 4 couches (§4) |

---

## 2. Modèle de données

`lib/types.ts` `Product` — **2 champs ajoutés** :

- `updatedAt: string` (ISO) — optimistic lock + tri admin (comme `Moto.updatedAt`, Phase 4b Task 1b).
- `deletedAt: string | null` — soft-delete dédié. **Server-only. TOUJOURS PRÉSENT** (`null` quand actif, ISO date quand supprimé).

> **Décision correctness (anti-ambiguïté) :** `deletedAt` est **toujours présent** sur chaque doc produit, jamais absent. Raison : Firestore `where('deletedAt','==', null)` ne matche **pas** les documents où le champ est _absent_ — modéliser `deletedAt?` optionnel/absent ferait disparaître toutes les fixtures actives du catalogue (bug silencieux). Donc : type `deletedAt: string | null` (pas `?`), `createProduct` set `deletedAt: null`, les 7+ fixtures `PRODUCTS` ont `deletedAt: null` explicite. La requête d'exclusion est `where('deletedAt','==', null)` (actifs) ; `deleteProduct` set la date ISO.

`lib/products.ts` : ajouter `updatedAt` (dates distinctes croissantes, testabilité tri comme 4b) ET `deletedAt: null` explicite à **toutes** les fixtures `PRODUCTS`.

`lib/schemas/product.ts` (existe déjà) : deux schémas distincts —

- **`ProductWriteSchema`** (`.strict()`) : validé depuis le formulaire ; **n'inclut PAS** `id`, `slug` (validé séparément), `createdAt`, `updatedAt`, `deletedAt`.
- **`ProductSchema`** (lecture/parse doc Firestore) : tolérant, inclut tous les champs persistés y compris `updatedAt`/`deletedAt?`.
- Sous-schéma `compatibilitySchema` : `z.array(...).max(50)` de `{ brand:str≤60, model:str≤60, yearFrom:int 1900..currentYear+2, yearTo:int optional }` + `.refine(yearTo >= yearFrom)`.

## 3. Adapter & cache

`lib/data/types.ts` : `ProductFilters` étendu avec `includeDeleted?: boolean` (défaut `false`).

`lib/data/static.ts` + `lib/data/firebase.ts` :

- `getProducts` / `getProductsByCategory` / promoted / featured : exclusion `deletedAt` **au niveau requête** (Firestore `where('deletedAt','==', null)` — pas filtre post-fetch). `includeDeleted:true` opt-in (contexte admin only).
- `getProductBySlug` / `getProductById` : retournent `null` si `deletedAt` présent, sauf `includeDeleted`.

`lib/data/products-cache.ts` (nouveau) : `getCachedProducts = unstable_cache(() => getAdapter().getProducts(), ['products-public'], { tags:['products'] })` — actifs only (hérite du filtre adapter). Le tag par-slug doit être réellement câblé dans la clé de cache (la dette `moto:${id}` prouve qu'un `revalidateTag` non câblé = no-op silencieux).

## 4. Soft-delete leak-proofing — architecture 4 couches (remplace décision 4)

1. **Query-level** : exclusion `deletedAt` dans la requête Firestore de chaque lecture de liste.
2. **By-key** : `getProductBySlug`/`getProductById` honorent `deletedAt` (sinon fuite directe `/pieces/<slug>`).
3. **Rules** (defense-in-depth, le client SDK passe par les rules) : `firestore.rules` produits →
   `allow read: if resource.data.deletedAt == null || isAdmin();`
4. **Invalidation immédiate** : `deleteProduct`/`updateProduct` → `revalidateTag('products')` + `revalidatePath('/pieces/<slug>')` + revalidation sitemap **immédiate**. `revalidate=3600` = fallback, jamais le mécanisme de propagation de suppression.

Migration de **tous** les importeurs statiques `PRODUCTS` (checklist, 1 test de fuite par consumer) : `app/sitemap.ts`, `components/cart/CartProvider.tsx` (drop l'item supprimé/stock 0/introuvable au rehydrate localStorage), `app/(boutique)/pieces/CatalogueClient.tsx`. `pieces/[slug]/page.tsx` : `generateStaticParams` via import adapter direct (PAS `getCachedProducts` — `unstable_cache` throw hors contexte requête, leçon 4a) + filtre actifs.

## 5. Admin CRUD

`app/admin/products/actions.ts` (nouveau) — miroir `motos/actions.ts` :

- `createProduct` / `updateProduct` / `deleteProduct` (+ `restoreProduct` séparé).
- `requireAdmin()` **première instruction** de chaque action, avant `parseForm`.
- Optimistic lock sur `updatedAt` (transaction ; conflit → `{ errors: { _form: [...] } }`). **`deleteProduct` prend le même lock** (pas de blind update — corrige la dette 4a/4b sur le delete).
- `parseForm` : liste de champs **explicite** (allowlist implicite, style 4b conservé), strip `undefined`/vides (Firestore Admin rejette `undefined`), prix € → centimes via `Math.round`, `compatibility[]` reconstruit en dense borné.
- `writeAuditLog` POST-commit, `resourceType:'product'`, sur **chaque** mutation **et sur tentative refusée** (`requireAdmin` échoué → log `denied` avant rethrow).
- `revalidateTag('products')` + `revalidatePath` + sitemap après chaque mutation.

## 6. ProductForm + sous-form compat

`components/admin/ProductForm.tsx` (nouveau) — base `MotoForm`, champs `Product` :

- Scalaires : name, reference, slug, description, shortDescription, price (€→centimes), priceOriginal?, category (8-enum), vehicleType (auto/moto), stock (number), isPromoted (checkbox), images (`ImageUploader folder="products"`).
- **Sous-form compat répétable** : composant contrôlé `CompatibilityFields` — état React `VehicleCompatibility[]`, bouton « + Ajouter compatibilité », chaque ligne 4 inputs `compat_{i}_{brand|model|yearFrom|yearTo}` + bouton supprimer. `grid-cols-1 sm:grid-cols-4` (mobile Stéphane). Les `name=` DOIVENT matcher exactement la reconstruction `parseForm`.
- `id` généré server-side ou dérivé du slug validé ; `slug` validé regex avant tout usage comme doc path.

## 7. Pages admin

`app/admin/(shell)/products/` — miroir motos : `page.tsx`, `ProductsTable.tsx` (client wrapper, DataTable **avec search** — ~40 produits), `new/page.tsx`, `[id]/page.tsx`. Colonnes : name+reference, catégorie, prix FR €, stock (badge bas/rupture), StatusBadge actif/supprimé, Éditer. La vue admin passe `includeDeleted:true` (voir les supprimés + bouton Restaurer). Conserver le commentaire de dette fetch-all+find dans `[id]/page.tsx`.

## 8. Tests

- **Unit** : `product.test.ts` (schémas, `.strict()` rejette inconnu, bornes, `deletedAt`/`updatedAt`), `admin-products-actions.test.ts` (CRUD + lock + soft-delete + audit + denied), `ProductForm.test.tsx` (**RTL, incl. compat add/remove — dès le départ pour la coverage gate**, leçon CI 4b), `data-adapter.test.ts` régression (`deletedAt` filtré par défaut query-level + by-key + `includeDeleted`).
- **E2E** : `catalogue-public.spec.ts` (anti-régression catalogue non vide + produit supprimé absent en liste/by-slug/sitemap), `admin-products.spec.ts` (auth via le pattern `seed meta/admins` Admin SDK + emulator-login établi en #23 — NE PAS réintroduire le REST PATCH non-auth).

## 9. Exigences de durcissement (28, testables — chacune = 1 contrôle + comment le tester)

> Issues du threat model Opus (security-advisor) recherche-backé. Numérotation conservée.

**Access control**

1. Chaque Server Action Phase 5 (`createProduct`/`updateProduct`/`deleteProduct`/`restoreProduct`) appelle `requireAdmin()` **en première instruction**, avant `parseForm`. _Test :_ action sans cookie `__session` et avec cookie poubelle → `AdminError 401/403`, 0 écriture Firestore, 0 changement d'état.
2. Aucune fonctionnalité Phase 5 dans un Route Handler `app/api/admin/*` sauf si le handler invoque `requireAdmin()` dans son corps (ne PAS s'appuyer sur `middleware.ts`). _Test :_ `curl -X POST/DELETE` avec `__session=x` forgé → 401, 0 mutation. _(P0 backlog : retrofit `requireAdmin()` sur les GET/PATCH `products`/`orders` existants — déjà fait #23.)_
3. `middleware.ts` reste presence-only et explicitement **PAS** un contrôle d'auth (documenté dans le spec). _Test :_ revue de code — aucun fichier Phase 5 ne traite le middleware comme authz.

**Input validation / mass assignment** 4. `ProductWriteSchema` (path write) utilise `.strict()` → clés inconnues **rejetées** (pas stripped). Schéma lecture séparé tolérant si besoin pour parser les docs Firestore. _Test :_ `safeParse({...valid, hacked:1})` → `success:false`. 5. Champs server-controlled **absents** du schéma write ET de la liste lue par `parseForm` : `id`, `createdAt` (server, create only), `updatedAt` (server, chaque write), `deletedAt` (server, `deleteProduct` only). _Test :_ soumettre chacun via formData → ignoré/écrasé server-side ; `updateProduct` ne peut pas set `deletedAt` ; `deleteProduct` est le seul chemin qui le set. 6. `slug` et `id` matchent `^[a-z0-9]+(?:-[a-z0-9]+)*$`, longueur 1–80, validés **avant** usage comme doc path Firestore. Rejeter `/`, `.`, `..`, unicode, majuscule. _Test :_ `id='../meta/admins'`, `slug='a/b'`, `slug='a'*200` → schéma rejette, aucun doc path construit. 7. Unicité `slug` sur create/update **dans la transaction** (query existant par slug, rejet si collision avec un id différent). _Test :_ créer produit B avec le slug de A → erreur conflit, pas d'overwrite. 8. Caps longueur : `name` ≤200, `reference` ≤100, `shortDescription` ≤300, `description` ≤5000, `compatibility.brand/model` ≤60. _Test :_ input au-dessus du cap → rejet schéma. 9. `price`/`priceOriginal` : `z.number().int().min(0).max(100_000_00)` (cap 1M€, centimes). Conversion € → cents `Math.round(euros*100)`. `parseForm` rejette `NaN`/`Infinity`/non-fini (`Number.isInteger` après conversion). _Test :_ `prix="1e308"`, `"19,99"`, `"-5"`, `"0x10"` → rejet ou cents sûrs déterministes ; `19,99€ → 1999`. 10. `compatibility` : `z.array(schema).max(50)` ; `yearFrom`/`yearTo` `int().min(1900).max(currentYear+2)` ; refine `yearTo >= yearFrom`. _Test :_ array 51 éléments → rejet ; `yearTo<yearFrom` → rejet. 11. Reconstruction `compat_{i}_*` dense + cap dur : itérer `i=0..MAX(50)`, stop au premier `compat_{i}_brand` manquant ; ignorer indices supérieurs ; jamais allouer par l'index max soumis. _Test :_ soumettre seulement `compat_0_*` et `compat_99999_*` → résultat = exactement 1 entrée. 12. `images` : `z.array(z.string().url()).max(8)` ; chaque host dans une allowlist (`firebasestorage.googleapis.com`, bucket Storage configuré ; rejeter `javascript:`/`data:`/hosts arbitraires) — rigueur `vehicule.ts:38` que `product` n'a pas aujourd'hui. _Test :_ `images:['javascript:alert(1)']`, `['http://evil/x']`, 9 urls → rejet.

**Stored XSS / JSON-LD (impact max)** 13. Toute injection `<script type="application/ld+json">` passe par `safeJsonLd` (livré P0 #23, `lib/safe-json-ld.ts`) ; `pieces/[slug]` (Phase 5) doit l'utiliser. _Test :_ produit `description: 'x</script><script>window.__xss=1</script>'` → HTML rendu contient `</script>`, `window.__xss` `undefined` après chargement (assertion Playwright). 14. **CSP : retirer `'unsafe-inline'` de `script-src` ou nonce par requête.** JSON-LD = seul inline non-framework ; le contrôle réaliste = `nonce` (Next 15 via middleware/headers) ou strict-dynamic. _Test :_ header CSP sans `'unsafe-inline'` pour `script-src`, ou contient `'nonce-...'` ; `<script>` inline injecté bloqué par CSP. 15. Rendu admin des champs produit (list/detail/preview) : `name`/`description`/`reference` en texte (React auto-escape — vérifier 0 `dangerouslySetInnerHTML`), `images` via `next/image` (remotePatterns) pas `<img>` brut où l'URL est influençable. _Test :_ grep composants Phase 5 `dangerouslySetInnerHTML` → seul le helper JSON-LD échappé autorisé.

**Soft-delete leak-proofing** 16. Exclusion query-level : `getProducts`/`getProductsByCategory`/promoted/featured ajoutent `where('deletedAt','==',null)` à la **requête**, pas post-fetch. `includeDeleted:true` opt-in admin only. _Test :_ soft-delete, `getProducts()` public → absent ; `getProducts({includeDeleted:true})` → présent. 17. Lectures by-key honorent `deletedAt` : `getProductBySlug`/`getProductById` → `null` pour doc soft-deleted sauf `includeDeleted`. _Test :_ delete produit, `GET /pieces/<slug>` → 404 (`notFound()`), `getProductById(id)` → null. 18. Durcir `firestore.rules` read produits (defense-in-depth, lectures via client SDK) : `allow read: if resource.data.deletedAt == null || isAdmin();`. _Test :_ émulateur rules : anon `get(products/<deleted-id>)` → refusé ; admin → autorisé. 19. Migrer **tous** les importeurs statiques `PRODUCTS` vers l'adapter (checklist spec) : `app/sitemap.ts`, `pieces/[slug]` `generateStaticParams` (import adapter direct, actifs only), `components/cart/CartProvider.tsx`, `app/(boutique)/pieces/CatalogueClient.tsx`. _Test (par fichier) :_ soft-delete → absent `/sitemap.xml`, non restaurable au cart, absent liste `/pieces`. 20. Cart : `rehydrateItems` traite « introuvable OU `deletedAt` OU stock 0 » identiquement (drop l'item). _Test :_ cart localStorage avec productId supprimé → item retiré, pas de prix/nom ressuscité.

**Cache invalidation** 21. Clé/tags `getCachedProducts` incluent une dimension par-slug OU delete/update fait `revalidateTag('products')` (collection) que le wrapper porte réellement. Vérifier que le tag par-id est câblé dans l'entrée de cache (la dette `motos-cache.ts` prouve qu'un tag par-id non câblé est un no-op). _Test :_ update prix produit, fetch page publique immédiat → nouveau prix (pas périmé 1h). 22. `deleteProduct`/`updateProduct` : `revalidateTag('products')` + `revalidatePath('/pieces/<slug>')` + revalidation sitemap **immédiate**. _Test :_ delete produit, en quelques secondes : `/pieces/<slug>` → 404, liste `/pieces` l'exclut, `/sitemap.xml` l'exclut. 23. `generateStaticParams` `pieces/[slug]` importe l'adapter directement (PAS `getCachedProducts`) + filtre actifs. _Test :_ build avec produit soft-deleted → aucune route statique générée pour lui.

**Intégrité / lock / audit** 24. `deleteProduct` prend le même chemin optimistic-lock que `updateProduct` (transaction lisant `updatedAt`, conflit si token client périmé). _Test :_ updateProduct + deleteProduct concurrents token périmé → l'un renvoie conflit, pas de lost update. 25. Audit log sur chaque mutation incl. soft-delete, ET log des tentatives refusées : wrapper l'échec `requireAdmin()` pour émettre un enregistrement minimal (`action:'denied'`, actor=uid-si-présent, 0 PII) avant rethrow. _Test :_ tentative delete non autorisée → `audit_log` a une entrée denied ; delete réussi → entrée avec `action:'delete'`, `resourceType:'product'`. 26. Échec d'écriture audit non silencieux pour mutations sécurité-relevantes — log stderr (logs Vercel) au minimum. _Test :_ forcer `writeAuditLog` à throw → erreur surfacée dans les logs serveur, pas absorbée.

**Autres** 27. Rate limiting : le limiter in-memory ADR-004 ne persiste pas entre instances Vercel → pas un vrai contrôle. Pour 1 admin : (a) gate crypto `requireAdmin()` (vraie défense), (b) DDoS/WAF Vercel, (c) quotas Firestore en backstop. **Ne PAS construire de rate-limiter distribué custom** (disproportionné) ; documenter la décision + activer une règle Vercel WAF/Firewall sur `/api/admin/*` + POST Server Actions si dispo. _Test :_ décision documentée + (si WAF) règle présente. 28. `next.config.js` : ajouter `serverActions.allowedOrigins` = domaine prod (+ pattern preview) en defense-in-depth sur le check Origin==Host par défaut de Next. _Test :_ POST Server Action avec `Origin: evil.com` forgé → rejeté.

## 10. Hors scope (YAGNI)

Champs v2 commentés (`stockType`, `deliveryDays`) restent commentés. Pas de variantes produit. Pas de bulk-edit. Pas d'historique au-delà d'`audit_log`. Pas de rate-limiter distribué custom (§9.27). Le réordonnancement cosmétique `await props.params` dans `app/api/admin/orders/[id]/route.ts` (résiduel P0) n'est PAS du scope produit Phase 5 — backlog séparé.

## 11. Threat model — résumé (sévérité, vecteur)

| Menace                                           | Vecteur                                                           | Sév  | Exigence(s) |
| ------------------------------------------------ | ----------------------------------------------------------------- | ---- | ----------- |
| Stored XSS JSON-LD                               | `name`/`description` → `<script ld+json>` ; CSP `'unsafe-inline'` | Crit | 13, 14, 15  |
| Broken access control API                        | route `/api/admin/*` non-gated                                    | Crit | 1, 2, 3     |
| Mass assignment                                  | pas de `.strict()` → set `deletedAt`/`price`/`isPromoted`         | High | 4, 5        |
| Fuite soft-delete by-key                         | `getProductBySlug` sans filtre + `allow read;` inconditionnel     | High | 16, 17, 18  |
| Fuite soft-delete importeurs statiques           | sitemap/cart/catalogue importent `PRODUCTS`                       | High | 19, 20      |
| Cache prix/suppression périmé                    | `revalidate=3600` + tag par-slug non câblé                        | High | 21, 22, 23  |
| compatibility[] DoS / doc-size                   | array non borné, reconstruction sparse                            | Med  | 10, 11      |
| Slug → doc-path / route confusion                | pas de regex, id = doc path                                       | Med  | 6, 7        |
| Price/cents manipulation                         | pas de max, NaN/locale                                            | Med  | 9           |
| Optimistic-lock bypass delete                    | blind update                                                      | Low  | 24          |
| Audit omission / tentatives refusées non loggées | best-effort, pas de log denied                                    | Low  | 25, 26      |
| Malicious image URL                              | `images` pas `.url()`                                             | Low  | 12          |

**Top 5 si shippé sans durcissement** : XSS JSON-LD · API non-gated · mass-assignment · fuite soft-delete by-key · cache prix périmé. _(Les 2 premiers Crit déjà fermés en P0 #23 ; Phase 5 ferme les 3 autres + le résiduel defense-in-depth.)_

## 12. Décisions de design pour isolation/clarté

- `CompatibilityFields` = unité isolée (état array, interface `value/onChange`, testable seul) — ne pas inliner dans `ProductForm`.
- Schémas write/read séparés = frontière claire input hostile vs doc de confiance.
- Les 4 couches soft-delete = responsabilités distinctes (query / by-key / rules / invalidation) chacune testable indépendamment.
- `safeJsonLd` réutilisé (1 helper, déjà livré) — pas de duplication d'échappement.
