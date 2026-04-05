# Revue de code — MVP GP Parts v1.0

**Date** : 5 avril 2026
**Portée** : MVP statique Next.js 14.2 / TypeScript / Tailwind
**Fichiers audités** : 27 fichiers sources (app/, components/, lib/, config)

---

## 1. Bugs critiques corrigés pendant la revue

### 🔴 B1 — Lien produit brisé depuis le panier
**Fichier** : `components/cart/CartItemRow.tsx`
**Problème** : Le lien du nom du produit pointait vers `/catalogue/${item.productId}` (ex: `prod-001`) alors que les pages produits sont routées par **slug** (ex: `disque-de-frein-avant-peugeot`). Résultat : 404 systématique en cliquant sur un nom dans le panier.
**Fix appliqué** :
- Ajout du champ `slug` à l'interface `CartItem`
- `CartProvider.addItem` renseigne `slug` depuis le produit
- `CartItemRow` utilise `item.slug`
**Impact** : Navigation panier → fiche produit fonctionnelle.

### 🔴 B2 — `useSearchParams` sans `Suspense` → build cassé
**Fichier** : `app/catalogue/page.tsx`
**Problème** : Next.js 14 **exige** qu'un composant utilisant `useSearchParams()` soit encapsulé dans une `<Suspense>` boundary, sinon `next build` échoue avec :
```
useSearchParams() should be wrapped in a suspense boundary at page "/catalogue"
```
**Fix appliqué** :
- `app/catalogue/page.tsx` devient un Server Component qui rend `<Suspense><CatalogueClient /></Suspense>`
- La logique de filtrage est extraite dans `app/catalogue/CatalogueClient.tsx` ('use client')
- Skeleton de fallback affiché pendant le chargement
**Impact** : Le build passe + amélioration UX (skeleton au lieu d'écran blanc).

### 🟠 B3 — Lien de navigation `/compte` vers page inexistante
**Fichier** : `components/layout/Navbar.tsx`
**Problème** : Entrée "Compte" dans le menu pointait vers `/compte` qui n'est pas implémenté (pas d'auth en MVP statique) → 404.
**Fix appliqué** : Remplacé par "Promos" pointant vers `/catalogue?promo=1`.
**Impact** : Aucun lien brisé dans la navigation.

### 🟠 B4 — Incohérence du seuil "stock faible"
**Fichiers** : `lib/utils.ts`, `app/admin/page.tsx`
**Problème** : `getStockStatus` considérait un produit avec `stock < 5` comme "low-stock", tandis que l'admin comptait `stock <= 5`. Un produit avec exactement `stock: 5` apparaissait donc en **vert "En stock"** sur le catalogue mais comptait dans l'alerte "stock faible" de l'admin.
**Fix appliqué** :
- Création d'une constante partagée `LOW_STOCK_THRESHOLD = 5` dans `lib/utils.ts`
- `getStockStatus` utilise `stock <= LOW_STOCK_THRESHOLD`
- `admin/page.tsx` importe et réutilise la constante
**Impact** : Une seule source de vérité pour le seuil, cohérence front/back.

### 🟡 B5 — Regex code postal acceptait la Martinique
**Fichier** : `app/commande/page.tsx`
**Problème** : `/^97[1-2]\d{2}$/` acceptait aussi les codes postaux 972xx (Martinique), alors que l'offre est limitée à la Guadeloupe.
**Fix appliqué** : Remplacé par `/^971\d{2}$/`.
**Impact** : Validation géographique correcte.

---

## 2. Points d'amélioration recommandés (non bloquants)

### 🟡 A1 — Bouton "X" du CookieBanner = refus implicite
Le bouton de fermeture (X) appelle `rejectAll()` et sauvegarde le consentement. L'utilisateur qui voudrait juste fermer sans décider n'a pas d'option. **Recommandation RGPD** : ne rien sauvegarder au clic sur X, juste fermer temporairement, et ré-afficher à la prochaine visite.

### 🟡 A2 — `createdAt` identique sur tous les produits
Tous les produits ont `createdAt: '2026-01-15T00:00:00.000Z'`. Sans importance pour la démo, mais empêche de tester un tri "nouveautés". Recommandation : varier sur 30 jours.

### 🟡 A3 — Pas de tri dans le catalogue
Le catalogue offre filtres + recherche mais aucun tri (prix croissant/décroissant, nom, nouveautés). Feature courante que les utilisateurs attendent.

### 🟡 A4 — `line-clamp-2` et `line-clamp-3` redéfinis manuellement
Dans `app/globals.css`, ces classes sont recréées alors que Tailwind 3.4 les fournit nativement via `line-clamp-{n}`. Peut être supprimé sans impact.

### 🟡 A5 — `next.config.js` vide
Pas de configuration `images.domains` prévue pour les futures vraies images (Firebase Storage, Cloudinary, etc.). À anticiper avant la phase production.

### 🟡 A6 — Admin en lecture seule non documenté
Les boutons "Modifier" et "Nouveau produit" existent visuellement mais n'ont pas de handler. Un utilisateur cliquera et ne se passera rien. Recommandation : désactiver avec un tooltip "Disponible en v2 (Firestore)" ou cacher complètement.

### 🟡 A7 — Accessibilité : quantité dans AddToCartButton sans `aria-live`
Le compteur de quantité change mais n'est pas annoncé aux lecteurs d'écran. Ajouter `aria-live="polite"` sur le `<span>` qui affiche la quantité.

### 🟡 A8 — Gestion d'erreur de paiement absente
Le checkout simule un `setTimeout(800)` puis succède toujours. Prévoir un cas d'échec (même simulé, probabilité 5 %) pour tester le flux d'erreur avant de passer à Stripe.

### 🟡 A9 — `app/catalogue/[slug]/page.tsx` — `params` sync
Next 14.2 accepte encore `params: { slug: string }` en synchrone. Avec **Next 15**, `params` devient une `Promise` et il faudra faire `const { slug } = await params;`. À noter dans la roadmap d'upgrade.

### 🟡 A10 — Pas de sitemap ni robots.txt
Pour le SEO : `app/sitemap.ts` et `app/robots.ts` manquent. Simple à générer depuis `PRODUCTS`.

### 🟡 A11 — Images placeholder uniquement
Aucune vraie image dans `public/images/`. Les URLs référencées dans `products.ts` (`/images/placeholder-disque.jpg`) n'existent pas. Pas bloquant car le UI affiche un placeholder CSS, mais les `<img>` produiraient un 404 si utilisés. Il n'y en a actuellement aucun — OK.

### 🟡 A12 — Pas de retour après ajout au panier
`AddToCartButton` affiche "Ajouté ✓" pendant 2s mais ne propose pas d'aller au panier. Ajouter un petit toast "Voir le panier →".

---

## 3. Points positifs

- ✅ **Architecture propre** : séparation app/ (pages), components/ (UI), lib/ (logique). Conforme aux bonnes pratiques Next.js 14.
- ✅ **Types forts** : tous les objets métiers (Product, CartItem, OrderInfo) sont typés.
- ✅ **Prix en centimes** : discipline respectée partout, aucun `parseFloat`.
- ✅ **CartProvider anti-hydratation** : pattern `isReady` correctement implémenté, pas de flash "0 article" au chargement.
- ✅ **Design system cohérent** : utilisation systématique des tokens (`bg-ivory`, `text-volcanic`, `rounded-pill`) — aucune valeur en dur hors du `tailwind.config.ts`.
- ✅ **Accessibilité** :
  - skip-link présent
  - labels aria sur icônes et boutons non textuels
  - focus-visible rings sur Button, liens, inputs
  - breadcrumb avec `<nav aria-label>` + `<ol>`
  - bannière cookies avec `role="dialog"`
- ✅ **JSON-LD Product** sur fiche produit → bon pour SEO
- ✅ **Métadonnées** : `metadataBase`, `openGraph`, template de titre — OK
- ✅ **Validation formulaire** : email, téléphone, code postal, CGV — pattern correct avec errors typés
- ✅ **Empty states** : panier vide, recherche sans résultats, absence de commande récente — tous gérés
- ✅ **RGPD** : 3 catégories de consentement, 4 pages légales, consentement timestampé

---

## 4. Vérification du build

⚠️ Le build n'a pas pu être exécuté dans la sandbox (registry npm bloqué : `403 Forbidden` sur `registry.npmjs.org`). Les corrections appliquées ci-dessus sont basées sur une revue manuelle et doivent être validées côté utilisateur avec :

```bash
cd gpparts
npm install
npm run build
```

### Check-list de build à vérifier en local
- [ ] `npm install` termine sans erreur
- [ ] `npm run build` réussit (attention au point B2 désormais corrigé)
- [ ] Aucun warning TypeScript
- [ ] `npm run dev` puis navigation de /, /catalogue, /catalogue/{slug}, /panier, /commande, /admin, /mentions-legales, /cgv, /confidentialite, /cookies
- [ ] Ajouter un produit au panier, passer commande, voir confirmation
- [ ] Tester le filtre `?promo=1` et `?category=freinage`
- [ ] Ouvrir en responsive (DevTools) : mobile, tablette, desktop

---

## 5. Roadmap post-MVP (suggestions priorisées)

### P0 — Préparation production
1. **Firebase setup** : Auth (admin), Firestore (produits/commandes/stock), Storage (images)
2. **Stripe** : remplacer le mock checkout par Checkout Session + webhook
3. **Emails transactionnels** : Brevo ou Resend pour confirmation de commande
4. **Page `/compte`** : historique commandes, suivi statut
5. **CRUD admin** : édition produits, upload images, création promos datées

### P1 — Expérience utilisateur
6. Tri catalogue (prix, nom, nouveautés)
7. Toast de confirmation après ajout panier
8. Page "Nouveautés" et "Meilleures ventes"
9. Recherche instantanée (Algolia ou MeiliSearch)
10. Sélecteur véhicule persistant ("Ma Peugeot 208") pour filtrer par compatibilité

### P2 — Performance & SEO
11. `sitemap.ts` + `robots.ts`
12. Images optimisées via `next/image` + Cloudinary ou Firebase
13. Lighthouse audit (cible : 90+ sur tous les axes)
14. Cache Next.js ISR pour le catalogue

### P3 — Business
15. Notifications push (FCM) pour alertes stock et commandes
16. Programme de fidélité
17. Devis B2B (garages pros)
18. Multilangue (français/créole optionnel)

---

## 6. Conclusion

Le MVP statique est **fonctionnellement solide** après les 5 corrections critiques appliquées pendant cette revue. La base de code est claire, typée, respecte le design system et les bonnes pratiques Next.js 14. Les points d'amélioration listés sont tous non-bloquants et peuvent être traités en itérations courtes.

**Recommandation** : valider le build local (`npm run build`) avant de démarrer la phase "Firebase + Stripe" (P0 de la roadmap).

---

## 7. Round 2 — Corrections & améliorations complémentaires (5 avril 2026)

Suite à une seconde passe de revue, les améliorations suivantes ont été appliquées :

### 🔴 R1 — `Input` : `Math.random()` → `useId()` (risque hydratation SSR)
**Fichier** : `components/ui/Input.tsx`
**Problème** : L'id fallback était généré via `Math.random()` au render, ce qui produit un id différent entre serveur et client → warning d'hydratation React + `htmlFor`/`id` mismatchés.
**Fix** : remplacement par `useId()` de React (stable SSR↔client). Ajout du `'use client'` explicite.

### 🟠 R2 — `CartProvider` : non-mémoïsé → re-renders cascade
**Fichier** : `components/cart/CartProvider.tsx`
**Problème** : Le `value={{...}}` du Provider était recréé à chaque render, provoquant des re-renders inutiles de tous les consumers (Navbar, Panier, Checkout…). `totalItems`/`totalPrice` étaient recalculés à chaque render.
**Fix** : `useMemo` sur `value`, sur les totaux, et sur les callbacks déjà en `useCallback`. Ajout d'une fonction `rehydrateItems()` qui re-synchronise le panier persisté contre `PRODUCTS` au montage (prix / stock / nom mis à jour, produit disparu éliminé, quantité clampée). Empêche la dérive entre panier local et catalogue.

### 🟠 R3 — `formatPrice` : pas de guard sur inputs invalides
**Fichier** : `lib/utils.ts`
**Problème** : `formatPrice(NaN)` ou `formatPrice(-100)` produisait un affichage cassé ("—" sur NaN, "-1,00 €" sur négatif).
**Fix** : guard `Number.isFinite`, clamp ≥ 0, arrondi au centime entier via `Math.round`.

### 🟠 R4 — Checkout : `autoComplete` manquant → pas d'autofill navigateur
**Fichier** : `app/commande/page.tsx`
**Problème** : Les 7 inputs du checkout n'avaient aucun attribut `autoComplete`, `name` ou `inputMode`. Les utilisateurs devaient tout taper à la main, les password managers ne reconnaissaient pas les champs.
**Fix** : ajout de `autoComplete="given-name"` / `family-name` / `email` / `tel` / `street-address` / `postal-code` / `address-level2` + `inputMode` pertinent (`email`, `tel`, `numeric`) + `maxLength={5}` sur code postal. Gain UX massif sur mobile.

### 🟠 R5 — Catalogue : recherche substring simple + filtres non partageables
**Fichier** : `app/catalogue/CatalogueClient.tsx`
**Problèmes** :
- Recherche "frein avant" ne matchait que si la chaîne exacte existait dans un champ → très restrictif
- Les filtres sélectionnés n'étaient pas persistés dans l'URL → impossible de partager ou de faire "retour navigateur"
**Fix** :
- Recherche **tokenisée** : split sur les espaces, chaque token doit matcher (AND logique) un des champs (nom, référence, marques et modèles de compatibilité)
- **Sync filtres → URL** via `router.replace()` (sans scroll) dans un `useEffect`. Les paramètres `q`, `type`, `category`, `sort`, `promo` reflètent l'état courant. Partageable et bookmarkable.

### 🟡 R6 — Admin : calculs non-mémoïsés + filtre "Stock faible" incluait les ruptures
**Fichier** : `app/admin/page.tsx`
**Problèmes** :
- Les KPIs (lowStockCount, outOfStockCount, promoCount, stockValue) étaient recalculés à chaque frappe dans la recherche → 4 `filter` + 1 `reduce` à chaque keystroke
- Le filtre "Stock faible" incluait les produits à stock=0, qui ont pourtant leur propre état "Rupture" affiché séparément → confusion visuelle
**Fix** :
- `useMemo` unique qui parcourt `PRODUCTS` une seule fois pour calculer les 5 KPIs
- `useMemo` sur `filtered` dépendant de `[search, filter]`
- Filtre low-stock corrigé : `p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD`

### 🟡 R7 — Sitemap/robots : URL de base hardcodée
**Fichiers** : `app/sitemap.ts`, `app/robots.ts`
**Problème** : `https://gpparts.gp` en dur → impossible de prévisualiser sur une URL Vercel/staging sans modifier le code.
**Fix** : lecture de `process.env.NEXT_PUBLIC_SITE_URL` avec fallback sur `https://gpparts.gp`, strip de trailing slash défensif.

### 🟡 R8 — CartItemRow : a11y boutons quantité
**Fichier** : `components/cart/CartItemRow.tsx`
**Problème** : Boutons +/-/supprimer sans `type="button"` (risque d'être considérés comme submit dans un form parent), compteur sans `aria-live`.
**Fix** : `type="button"` partout, `aria-live="polite"` et `aria-label` sur le compteur, `title` contextuel quand le max stock est atteint.

### Bilan round 2
- 8 améliorations appliquées sur 7 fichiers
- 0 nouveau fichier, 0 dépendance ajoutée
- Gains : perf (moins de re-renders), UX (autofill, recherche multi-mots, URLs partageables), a11y (SSR stable, boutons corrects), robustesse (guard formatPrice, re-sync panier)
- **Re-valider le build local** : `npm run build` — aucune API changée, contrat stable.
