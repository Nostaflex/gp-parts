# Phase 6 — Paiement (Stripe Payment Element + paiement sur place)

> Statut : **Approuvé** (2026-05-30). Spec de référence avant plan d'implémentation.
> Projet : GP Parts (boutique pièces auto/moto Guadeloupe). Branche : `feat/phase6-stripe-payment`.

## Contexte

La partie « Commandes » de la roadmap Phase 6 est **déjà livrée** (PR #12, #18, #24) :
le checkout persiste la commande dans Firestore (`adapter.createOrder`) avec revalidation
des prix côté serveur, envoie les emails confirmation client + notification gérant (Resend),
et l'admin liste les commandes avec transitions de statut câblées (`/api/admin/orders`).

Le seul manque : le **paiement est simulé**
(`app/(boutique)/(checkout)/commande/page.tsx` — « Paiement simulé pour la démo »,
mock 95 % succès / `ERR_DECLINED`). Aucune intégration Stripe réelle.

Phase 6 se réduit donc à **remplacer le paiement simulé par deux chemins réels**.

## Décisions de cadrage (validées avec l'utilisateur)

| Décision | Choix | Raison |
|---|---|---|
| Mode de paiement | **Les deux** : carte en ligne OU sur place | Flexibilité client, courant pour une boutique pièces auto locale |
| Intégration carte | **Stripe Payment Element** (intégré) | Formulaire carte sur le site, design Volcanic Clarity conservé |
| Compte Stripe | **Pas encore** → mode **TEST** complet | Découple le dev du business ; passage live = swap des clés |
| Remboursements in-app | **Hors périmètre v1** | Via dashboard Stripe |

## Périmètre

Deux chemins de paiement choisis par le client sur la page checkout :

- **Carte bancaire** → Stripe Payment Element, mode test (cartes fictives `4242…`).
- **Au retrait / livraison** → aucun paiement en ligne, Stéphane encaisse sur place.

## Modèle de données — `Order` (`lib/types.ts`)

Ajout de 3 champs, rétro-compatibles (optionnels en lecture pour les commandes existantes) :

```ts
paymentMethod: 'card' | 'on_site'
paymentStatus: 'pending' | 'paid' | 'failed'
stripePaymentIntentId?: string
```

`OrderStatus` (les 6 statuts : nouvelle → confirmee → preparation → expediee → livree, + annulee)
reste **inchangé** — c'est le cycle **logistique**. `paymentStatus` est **orthogonal** (l'état du paiement).
Le schéma Zod `lib/schemas/order.ts` est étendu en conséquence (write strict, read tolérant aux anciens docs sans ces champs).

## Flow carte (Payment Element)

1. **Création commande + PaymentIntent** — `validateCheckout` (serveur, existant) revalide
   les prix produit par produit, recalcule le total, puis crée la commande Firestore avec
   `paymentMethod:'card'`, `paymentStatus:'pending'`, `status:'nouvelle'`. Le serveur crée un
   **PaymentIntent** (montant = total recalculé **serveur**, devise EUR, `metadata:{orderId, orderNumber}`)
   et renvoie `{ orderId, clientSecret }`.
2. **Confirmation client** — le client monte le Payment Element avec `clientSecret`, confirme
   le paiement, puis est redirigé vers `/commande/confirmation`.
3. **Webhook = source de vérité** — `POST /api/stripe/webhook` :
   - `payment_intent.succeeded` → `paymentStatus:'paid'` + envoi des **emails** (confirmation client + notif gérant).
   - `payment_intent.payment_failed` → `paymentStatus:'failed'`.

   → Les emails **déménagent** du checkout vers le webhook pour le chemin carte :
   l'email ne part qu'au paiement réel, pas de commande fantôme confirmée par mail.

## Flow sur place (`on_site`)

`validateCheckout` crée la commande `paymentMethod:'on_site'`, `paymentStatus:'pending'`,
`status:'nouvelle'` et envoie les emails **immédiatement** (comportement actuel). Aucun appel Stripe.

## Page confirmation

Inchangée visuellement. Pour la carte : message « commande reçue » optimiste (le webhook peut
avoir 1-2 s de latence ; l'admin verra `paid` une fois l'event traité).
**Bug #3 préservé** : `setOrderPlaced(true)` avant `clearCart()` reste intact dans les deux chemins
(sinon le `useEffect(items.length === 0)` redirige vers `/panier`).

## Admin commandes

Ajout de 2 badges par commande dans `OrdersClient.tsx` :
- `paymentMethod` → « Carte » / « Sur place »
- `paymentStatus` → « Payé » / « À encaisser » / « Échec »

Permet à Stéphane de voir d'un coup d'œil ce qui reste à encaisser au retrait.

## Sécurité / robustesse

- **Montant toujours recalculé serveur** (déjà le cas dans `validateCheckout`) — jamais le prix client.
- **Signature webhook vérifiée** via `STRIPE_WEBHOOK_SECRET` (rejet si invalide).
- **Idempotence webhook** : vérifier `paymentStatus` avant de renvoyer les emails / muter la commande
  (Stripe peut rejouer un event ; ne pas envoyer 2× les mails).
- Clés env (toutes en **test**) :
  `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
  Ajoutées à `.env.example`.

## Arbitrage explicite — commande créée avant paiement

Le chemin carte crée la commande **avant** le paiement (`paymentStatus:'pending'`). Conséquence :
un client qui abandonne après avoir cliqué « payer » laisse une commande `pending` non payée dans
Firestore. Acceptable pour une petite boutique. Le **nettoyage des `pending` abandonnées est déféré**
(pas v1). L'alternative — créer la commande seulement au webhook — interdit de stocker le panier
proprement (limites de taille des `metadata` Stripe) et est plus fragile. **Retenu : pending-avant-paiement.**

## Tests

- **Unit** : montant PaymentIntent == total commande recalculé serveur ; idempotence webhook
  (double event → un seul envoi mail) ; transitions `paymentStatus`.
- **E2E** : chemin carte (Stripe test, carte `4242…`) ; chemin sur place ; anti-régression Bug #3
  (`orderPlaced` posé avant `clearCart`).

## Hors périmètre (YAGNI v1)

- Remboursements in-app → via dashboard Stripe.
- Comptes clients / cartes enregistrées.
- Apple Pay / Google Pay (le Payment Element les offre, configuration différée).
- Gestion des litiges / disputes.
- Nettoyage automatique des commandes `pending` abandonnées.

## Definition of Done

- [ ] Champs `paymentMethod` / `paymentStatus` / `stripePaymentIntentId` ajoutés à `Order` + schéma Zod.
- [ ] Sélecteur « Carte » / « Sur place » sur la page checkout.
- [ ] Payment Element monté + confirmation paiement (mode test) fonctionnel bout-en-bout.
- [ ] Webhook `/api/stripe/webhook` : signature vérifiée, idempotent, mute `paymentStatus`, envoie les emails (chemin carte).
- [ ] Chemin sur place : commande créée + emails immédiats, sans Stripe.
- [ ] Badges paiement dans l'admin commandes.
- [ ] Bug #3 préservé (test E2E vert).
- [ ] `.env.example` documente les 3 clés Stripe.
- [ ] CI verte (lint + typecheck + tests + build).
