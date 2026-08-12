# Section « Réseaux sociaux » — auto-publication Instagram + Facebook

**Date** : 2026-07-02
**Statut** : Design validé (attente review écrite)
**Scope** : back-office `/admin/reseaux-sociaux` — publier des véhicules et motos
en vente sur l'Instagram Business + la Page Facebook de Car Performance.

## Problème / objectif

Stéphane veut diffuser ses véhicules/motos à vendre sur ses réseaux sans
ressaisir à la main. Aujourd'hui : rien (seul un lien click-to-WhatsApp
`wa.me` existe). On veut une section BO où il **connecte** ses comptes une
fois, puis **publie en 1 clic** un post (photo(s) + texte) sur Instagram et
Facebook depuis un véhicule/moto de son inventaire.

## Réalité API (recherche 2026)

- **Instagram / Facebook** : l'API Graph publie photos/carrousels sur un
  compte **Pro (Business/Creator)** lié à une **Page FB**. Pour son **propre
  compte** en **development mode** (comptes ajoutés comme rôles/test users),
  **pas d'app review publique** (le review 2–4 semaines ne concerne que les
  apps utilisées par des tiers). API **gratuite**.
- **Page Access Token** long-lived = **non-expirant** (tant qu'admin + app
  active) → sert aussi à publier sur l'IG lié → **pas de refresh cron** requis.
- **WhatsApp** : hors scope ici — pas d'envoi sortant gratuit propre (broadcast
  API = payant + opt-in ; libs non-officielles = violation CGU + ban). Reste le
  partage click-to-chat existant.

## Décisions (validées)

1. **MVP = auto-publish direct** (Graph API, app Meta propre), pas générateur seul.
2. **Contenu** : véhicules **et** motos. Pièces hors scope.
3. **Composition** : **carrousel** multi-photos (jusqu'à 10, depuis `images[]`).
4. **Plateformes** : Instagram **et** Page Facebook, cases à décocher par post.
5. **Caption** : auto-générée **éditable** avant publication.
6. **Historique** : on **stocke + affiche** « déjà posté le X sur IG/FB » mais
   le **repost reste autorisé** (choix laissé à Stéphane, pas de blocage dur).
7. **Publication immédiate** seulement (pas de planification en MVP).
8. **Tokens** : Firestore `meta/social`, Admin SDK, règles `isAdmin`.

## Prérequis externes (hors code — bloquants pour la publication)

1. **Comptes Stéphane** : Instagram en **Business/Creator** lié à une **Page
   Facebook** (les deux du business). À vérifier avec lui avant.
2. **App Meta developer** (créée par Djemil, une fois) : App ID + App Secret ;
   produits « Facebook Login » + « Instagram Graph API » ; redirect URI
   `https://<domaine>/api/admin/social/callback` ; permissions
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
   `instagram_basic`, `instagram_content_publish` (noms 2026 possibles :
   `instagram_business_basic`, `instagram_business_content_publish`). App en
   **dev mode**, comptes de Stéphane ajoutés en rôles → pas de review publique.
3. **Env Vercel** (secrets) : `META_APP_ID`, `META_APP_SECRET`.
4. Épingler la **version Graph API** courante au moment de l'implémentation
   (ex. `v23.0`) dans une constante unique.

> Contrainte : Meta **fetche les images** → il faut des **URLs publiques HTTPS**.
> Images uploadées = Firebase Storage (OK). Images seed = chemins relatifs
> `/images/...` → convertir en **absolu** via `absoluteUrl()`. Donc la
> publication ne fonctionne **que depuis la prod/preview** (domaine public),
> pas en local (`localhost` non-fetchable par Meta).

## Architecture — 4 briques isolées

### Brique 1 — Connexion OAuth (`lib/social/oauth.ts` + routes)

- Page `/admin/reseaux-sociaux` affiche le statut (connecté / non).
- « Connecter Instagram + Facebook » → redirige vers le dialog OAuth Meta
  (scopes ci-dessus) avec un param `state` anti-CSRF (stocké httpOnly cookie).
- Route `GET /api/admin/social/callback` :
  1. vérifie `state` ;
  2. échange `code` → user token court → **user token long-lived** ;
  3. `GET /me/accounts` → sélectionne la Page → **Page access token
     (non-expirant)** ;
  4. `GET /{page-id}?fields=instagram_business_account` → `igUserId` ;
  5. persiste dans `meta/social` via Admin SDK.
- « Déconnecter » → efface le doc.

**Interface** : `getSocialConnection()` (serveur, Admin SDK) → `{ connected,
pageId, pageName, pageAccessToken, igUserId, igUsername, connectedAt } | null`.

### Brique 2 — Génération de contenu (`lib/social/caption.ts`, pur)

`buildCaption(item: Vehicule | Moto): string` → titre + specs clés (année, km,
prix, énergie/permis) + accroche + hashtags (`#Guadeloupe #971 #Occasion`

- marque + type). **Pur, testable**, réutilise l'esprit du générateur Leboncoin.
  Retour éditable par l'admin avant envoi.

### Brique 3 — Publication (`lib/social/publish.ts`)

`publishToInstagram(conn, { imageUrls, caption })` :

- 1 image → container simple ; ≥2 → **carrousel** : un container enfant par
  image (`is_carousel_item=true`) → container parent `media_type=CAROUSEL` +
  `children` + `caption` → `POST /{ig-user-id}/media_publish`.
  `publishToFacebook(conn, { imageUrls, caption })` :
- upload chaque photo `published=false` → ids → `POST /{page-id}/feed` avec
  `message` + `attached_media`.
  `publishPost(conn, { imageUrls, caption, toInstagram, toFacebook })` orchestre,
  convertit les URLs relatives en absolues, retourne `{ instagram?: {permalink},
facebook?: {permalink}, errors: [...] }`. **Toute erreur Meta est remontée**
  (jamais avalée) ; un `OAuthException(190)` → signal « reconnecter ».

### Brique 4 — Server action + UI + données

- Server action `publishSocialPost(formData)` : `requireAdmin()`, lit la
  connexion, appelle `publishPost`, écrit un log `meta/social_posts`
  (`itemId, itemType, platforms, caption, postedAt, igPermalink?, fbPermalink?`),
  renvoie succès/erreurs. **Pas de blocage repost**.
- UI `/admin/reseaux-sociaux` (client) : bandeau connexion ; sélecteur
  véhicule/moto (inventaire live via `getAdapter`, comme Leboncoin) ; panneau
  compose (caption éditable, cases images du carrousel + ordre, toggles IG/FB,
  indicateur « déjà posté le X ») ; bouton Publier + retour succès/erreur.
- Entrée sidebar `/admin/reseaux-sociaux` (groupe diffusion, à côté d'Export
  Leboncoin), icône type `Share2`.

## Sécurité

- Tokens en `meta/social` : règles Firestore **admin-only**, lus **serveur
  seul** (Admin SDK), **jamais** exposés au client ni au bundle.
- `META_APP_SECRET` en env serveur.
- OAuth : `state` anti-CSRF, redirect URI verrouillé côté app Meta.
- Aucune écriture publique possible sur ces collections (rules).

## Gestion d'erreurs

- Publication : échec partiel possible (IG OK, FB KO) → on remonte le détail
  par plateforme, on logue ce qui a réussi.
- Token invalide (190) → statut « déconnecté » + invite « Reconnecter ».
- Rate limit IG (25 posts/24 h) → message explicite.
- Local/dev (images non publiques) → message « publication possible seulement
  en ligne (prod/preview) ».

## Tests (TDD)

1. `buildCaption` (pur) : véhicule et moto → contient marque/modèle/prix + hashtags.
2. Échange token OAuth (mock HTTP Meta) : callback stocke page token + igUserId ;
   `state` invalide → rejet.
3. `publishToInstagram` : 1 image → séquence simple ; ≥2 → séquence carrousel
   (enfants → parent → publish) — vérifiée via mock Graph.
4. `publishToFacebook` : upload N photos → `/feed` avec `attached_media`.
5. `publishPost` : URLs relatives → absolues ; erreur Meta **remontée** (pas
   avalée) ; échec partiel géré.
6. `publishSocialPost` action : `requireAdmin` (401 sans admin) ; écrit le log.
7. Règles Firestore `meta/social` + `meta/social_posts` : lecture/écriture
   **admin-only**, public refusé.

## Phasage d'implémentation

L'implémentation peut démarrer **sans attendre l'app Meta** sur :

- Brique 2 (caption, pur) ;
- squelette UI + entrée sidebar + data model + règles Firestore ;
- Briques 1/3 codées contre des **mocks** (tests verts sans creds).

Le **branchement réel** (connexion + 1er post live) nécessite les prérequis
externes (app Meta + comptes vérifiés + env Vercel) → étape finale, testée en
preview.

## Non-objectifs (YAGNI)

- Planification / file d'attente de posts.
- Pièces détachées (véhicules + motos seulement).
- WhatsApp broadcast (payant/risqué) — hors scope.
- Reels / Stories (posts feed carrousel seulement).
- API sociale tierce (Ayrshare/Late) — alternative payante notée, écartée au
  profit du direct gratuit ; réévaluable si la maintenance Meta devient lourde.
- Multi-comptes / plusieurs Pages (un seul business).
