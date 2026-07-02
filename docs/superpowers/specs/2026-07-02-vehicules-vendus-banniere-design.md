# Véhicules/motos vendus — visibles avec bannière « VENDU », non-interactifs

**Date** : 2026-07-02
**Statut** : Design validé (attente review écrite)
**Scope** : storefront `/vente-vehicule` + `/vente-moto` (liste + détail)

## Problème

Aujourd'hui, quand un véhicule/moto passe à `disponibilite: 'vendu'` (c'est
l'action « supprimer » du back-office, cf. `app/admin/vehicules/actions.ts:161`
et `app/admin/motos/actions.ts:154`), il est **retiré du site public** :

- Liste : filtré par `getCachedVehicules`/`getCachedMotos`
  (`.filter((v) => v.disponibilite !== 'vendu')`).
- Détail : la page fetch la même source filtrée → `find()` undefined →
  `notFound()` → **404**.

Stéphane veut au contraire **garder les vendus affichés** (preuve sociale,
« regardez ce qu'on a écoulé ») avec un **bandeau « VENDU »**, mais **sans
interaction possible** (on ne peut pas cliquer/contacter dessus).

## Décisions (validées avec l'utilisateur)

1. **Interaction** : carte vendue **non-cliquable** ; page détail **reste 404**
   sur URL directe. (« sans interaction possible » au sens strict.)
2. **Périmètre** : **véhicules ET motos** (même pattern, miroir).
3. **Position** : vendus **en dernier dans la liste**, grisés.
4. **Hors scope** : l'état `reserve` reste **inchangé** (cliquable, visible,
   pas de traitement nouveau).

## Architecture

### 1. Couche données — `lib/data/vehicules-cache.ts` + `lib/data/motos-cache.ts`

Retirer le filtre `!== 'vendu'`. Le cache public renvoie désormais **tout le
catalogue non hard-deleted** (disponible + reserve + vendu). Mettre à jour le
commentaire (« les vendus sont maintenant affichés publiquement, grisés »).

Impact : seuls consommateurs = les 4 pages publiques (liste+détail, véh+moto).
Aucun autre. Les tables/actions admin lisent l'adapter directement, pas le cache.

### 2. Page liste — `VenteVehiculeClient.tsx` + `VenteMotoClient.tsx`

- **Tri** : après filtrage, ordonner `vendu` en dernier
  (`disponible`/`reserve` d'abord, ordre existant préservé à l'intérieur).
- **Rendu carte vendue** (branche sur `v.disponibilite === 'vendu'`) :
  - élément **`<article>`** (pas `<Link>`) → aucun clic, pas de `href`,
    `cursor-default`, pas d'effet hover.
  - image **`grayscale opacity-60`**.
  - **bandeau « VENDU »** en travers de l'image : barre rouge
    (`bg-cp-red`, texte `cp-cream`, `cp-title` bold, rotation légère),
    lisible et sans ambiguïté.
  - CTA « Voir le véhicule → » remplacé par label statique **« Vendu »**
    (`text-cp-ink/40`).
  - le compteur « N véhicules » continue de compter l'ensemble affiché.
- Carte disponible/réservée : **inchangée** (reste `<Link>`).

Pour éviter de dupliquer ~75 lignes de JSX du corps de carte, extraire le
contenu commun (image + body) dans un petit sous-composant local
`VehiculeCardBody` / `MotoCardBody`, puis l'envelopper dans `<Link>` (dispo)
ou `<article>` (vendu). Le bandeau + les styles grisés sont appliqués par la
branche vendue.

### 3. Page détail — `vente-vehicule/[id]/page.tsx` + `vente-moto/[id]/page.tsx`

Le cache renvoie maintenant les vendus → `find()` les trouverait → la page
s'afficherait. Pour **préserver le 404** (décision 1), ajouter une garde
explicite juste après le `find` :

```ts
if (!v || v.disponibilite === 'vendu') notFound();
```

Idem dans `generateMetadata` (retourner le titre « introuvable » pour vendu),
par cohérence. `generateStaticParams` peut aussi exclure les vendus (évite de
pré-rendre des pages qui 404 ; optionnel, non bloquant).

Note : la branche `dispoLabel === 'Vendu'` existante dans le détail devient
définitivement morte (on 404 avant) — on peut la laisser (inoffensive) ou la
nettoyer ; laisser pour minimiser la surface du diff.

## Tests (TDD)

1. **`vehicules-cache` / `motos-cache`** : un item `vendu` est **inclus** dans
   le retour (inverse de l'assertion actuelle si elle existe → mettre à jour).
2. **`VenteVehiculeClient` / `VenteMotoClient`** (RTL) :
   - un véhicule `vendu` est rendu **sans rôle `link`**, avec le texte
     « VENDU », et le libellé « Vendu » à la place du CTA ;
   - un véhicule `disponible` est rendu **comme `link`** ;
   - dans une liste mixte, le vendu apparaît **après** les disponibles (ordre
     DOM).
3. **Garde détail** : audit + éventuel e2e — une URL de véhicule vendu → 404.
   (Couvert au minimum par l'inclusion cache + test client ; e2e si fixture
   vendu dispo.)
4. **Audit e2e existants** : `tests/e2e/vente-vehicule-public.spec.ts` /
   `vente-moto-public.spec.ts` — vérifier qu'aucun n'assume « vendu absent ».

## Point produit (noté, non bloquant)

Après ce changement, « supprimer » en back-office = « marquer vendu + garder
affiché grisé ». Il n'y a plus de **retrait total** du site via ce bouton. Si
Stéphane a besoin de retirer une annonce erronée entièrement, c'est un besoin
séparé (hard delete ou statut `masqué`) à traiter ultérieurement.

## Non-objectifs (YAGNI)

- Pas de traitement nouveau de `reserve`.
- Pas de refactor partagé véhicule/moto au-delà de l'extraction locale du body.
- Pas de hard-delete / statut « masqué » (point produit ci-dessus).
- Pas de publication auto réseaux sociaux (brainstorm séparé).
