# Location — Réservations (sous-projet B)

> Statut : **Approuvé** (2026-06-02). Projet : GP Parts. Branche : `feat/location-reservations`.

## Contexte

Le formulaire de réservation de `/location` (`app/location/LocationClient.tsx`, multi-step) est **factice** : à l'étape finale il appelle `generateRef()` + `setDone(true)` et affiche « un email de confirmation a été envoyé », mais **ne persiste rien et n'envoie aucun email**. Les demandes de réservation sont perdues.

Sous-projet **B** du découpage A→B→C. A (parc `LocationCar` + CRUD admin) est livré (PR #26). B rend les réservations réelles : persistance + emails + liste admin avec statuts. Le **calendrier / disponibilité par dates** reste le sous-projet **C** (hors B).

## Périmètre de B

- **Création publique** : le formulaire `/location` persiste une `Reservation` (statut `nouvelle`), recalcule le prix serveur, envoie un accusé au client + une notification à Stéphane.
- **Admin** : liste des réservations avec transitions de statut (cycle détaillé) + audit log.

**Hors périmètre B** (→ C) : vérification de disponibilité par dates, anti-double-booking, calendrier, blocage de périodes. En B, une réservation peut être prise sur une voiture `disponible` sans contrôle de chevauchement de dates.

## Décision : entité dédiée `Reservation`

Pas de réutilisation de `Demande` (sa shape nom/email/message ne porte ni dates, ni voiture, ni permis ; son cycle nouvelle/traitée ≠ cycle détaillé). Pas de sous-collection de `LocationCar` (complique la liste admin globale). → **Entité dédiée**, création façon **checkout** (action publique + recompute serveur), admin façon **commandes** (liste + transitions + `requireAdmin`).

## Modèle de données — `lib/reservations.ts`

```ts
export type ReservationStatus = 'nouvelle' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';

export type Reservation = {
  id: string;
  reference: string; // généré serveur (remplace generateRef factice)
  status: ReservationStatus;
  locationCarId: string; // lien vers LocationCar
  carLabel: string; // snapshot "Renault Clio V" (lisible même si la voiture change/disparaît)
  dateDepart: string; // ISO (jour) "YYYY-MM-DD"
  dateRetour: string; // ISO (jour)
  nbJours: number; // calculé serveur
  prixJourEnCents: number; // snapshot du prix au moment de la résa
  totalEnCents: number; // nbJours × prixJourEnCents, recalculé serveur
  customer: { prenom: string; nom: string; email: string; telephone: string; permis: string };
  createdAt: string; // ISO
  updatedAt: string; // ISO
  expiresAt: number; // unix ms — TTL Firestore native (purge RGPD), +12 mois (cf. Demande/audit)
};
```

- Prix/total **toujours recalculés serveur** (jamais le client) ; `carLabel`/`prixJourEnCents` snapshotés.
- `permis` = donnée personnelle → `expiresAt` (TTL Firestore natif, +12 mois), comme `Demande` et l'audit log.
- `status` mute **uniquement** côté admin.

## Schéma Zod — `lib/schemas/reservation.ts`

- `reservationSchema` (lecture tolérante) + `parseReservation`.
- Contraintes : `reference`/`carLabel`/`locationCarId` non vides, `status` enum, dates `YYYY-MM-DD` (regex), `nbJours` int ≥ 1, prix int ≥ 0, customer (prenom/nom non vides, email format, telephone 8–20, permis non vide), `expiresAt` number.
- Pas de schéma d'écriture « form » séparé : l'action publique construit l'objet à partir de champs validés + données serveur (cf. checkout).

## Adapter — `lib/data/{types,static,firebase}.ts`

```ts
createReservation(data: Omit<Reservation, 'id'>): Promise<string>;
getReservations(filters?: { status?: ReservationStatus; limit?: number }): Promise<Reservation[]>;
getReservationById(id: string): Promise<Reservation | null>;
updateReservationStatus(id: string, status: ReservationStatus): Promise<void>;
```

- `FirebaseAdapter` : collection `reservations`, `createReservation` via `addDoc` (écriture publique côté serveur — patron `createOrder`), tri `createdAt desc`, parse via `parseReservation`.
- `StaticAdapter` : store en mémoire + seed minimal (patron `ORDERS_STORE`).

## Création publique — `app/location/actions.ts`

`'use server'` — `validateReservation(formData)` (patron `validateCheckout`) :

1. Sanitize + valide champs requis : prenom, nom, email (format + anti-injection), telephone (regex 8–20), permis, `locationCarId`, `dateDepart`, `dateRetour`, `consent === true`.
2. Dates : format `YYYY-MM-DD`, `dateRetour > dateDepart`, `dateDepart` non passée.
3. Voiture : `adapter.getLocationCarById(locationCarId)` → doit exister **et** `disponible` (sinon `errors._form`). Lit `prixJourEnCents` + `carLabel = "{marque} {modele}"` côté serveur.
4. Recompute : `nbJours = ceil((retour − depart) / 1 jour)`, `totalEnCents = nbJours × prixJourEnCents`.
5. `reference` générée serveur (ex : `LOC-<timestamp36>-<rand4>`, patron `generateOrderNumber`).
6. `adapter.createReservation({ status:'nouvelle', expiresAt: Date.now()+TTL, ... })`.
7. Emails **fire-and-forget** via `lib/emails/send.ts` étendu : `sendReservationEmails(reservation)` → accusé client (« demande reçue, on vous recontacte ») + notif Stéphane (`EMAIL_ADMIN`). Silencieux si `RESEND_API_KEY` absente.
8. Retourne `{ success: true, reference }` ou `{ success: false, errors }`.

Nouveaux templates email : `lib/emails/reservationConfirmation.ts` + `lib/emails/reservationNotification.ts` (patron `orderConfirmation`/`orderNotification`).

## Admin — liste + statuts

- Route `/admin/(shell)/reservations/page.tsx` (server, `getReservations`) + `ReservationsClient.tsx` (liste + détail expandable, patron `OrdersClient`).
- `app/admin/reservations/actions.ts` : `updateReservationStatus(id, status)` — `requireAdmin` → transitions validées → `adapter.updateReservationStatus` → `writeAuditLog` (resourceType `'reservation'`) → `revalidatePath('/admin/reservations')`.
- Transitions autorisées : `nouvelle → confirmee | annulee` ; `confirmee → en_cours | annulee` ; `en_cours → terminee` ; `terminee → ∅` ; `annulee → ∅`. Une transition non autorisée renvoie une erreur (garde serveur, pas seulement UI).
- Badges statut (couleurs iOS Clarity : nouvelle=blue, confirmee=blue clair, en_cours=orange, terminee=green, annulee=red).
- Item sidebar « Réservations » (section Activité, `enabled: true`).
- **Pas d'email auto** sur transition (v1).

## Câblage formulaire storefront

`LocationClient.tsx` : l'étape finale (step 2) appelle `validateReservation` (server action) au lieu de `generateRef()`/`setDone(true)`. En succès → `setRef(result.reference)` + `setDone(true)` (réutilise l'écran de confirmation existant). En erreur → affiche `errors`. Le multi-step, les champs et l'UI restent inchangés. `generateRef()` est supprimé.

## Sécurité / robustesse

- Prix/total **recalculés serveur** (jamais la valeur client).
- L'action de création est **publique** (pas de `requireAdmin`) — comme le checkout — mais valide tout côté serveur et n'accepte que des voitures `disponible`.
- Mutation de statut **admin only** (`requireAdmin`) + transitions gardées serveur.
- `permis`/contact : TTL RGPD `expiresAt`. PII jamais loggée dans l'audit (cf. politique `lib/admin/audit.ts`).

## Tests

- **Unit** : schéma Zod `reservation` ; `validateReservation` (dates invalides, retour ≤ départ, date passée, voiture absente, voiture indispo, recompute `nbJours`/`totalEnCents`, succès) ; transitions admin (valides + rejets) ; StaticAdapter (create/get/updateStatus). Mirror `tests/unit/checkout.test.ts` + `admin-*-actions.test.ts` + `data-adapter`.
- **E2E** : différé (parcours multi-step + dates lourd ; le smoke admin existant couvre la nav). Noté explicitement.
- **Gate CI** : suite unit verte + typecheck + lint 0 nouveau + prettier + build.

## Definition of Done

- [ ] `lib/reservations.ts` (type `Reservation` + `ReservationStatus`).
- [ ] `lib/schemas/reservation.ts` (`reservationSchema` + `parseReservation`).
- [ ] Adapter : create/get/getById/updateStatus (interface + Static + Firebase).
- [ ] `app/location/actions.ts` `validateReservation` (validation + recompute + persist + emails).
- [ ] Templates `reservationConfirmation` + `reservationNotification` + `sendReservationEmails` dans `lib/emails/send.ts`.
- [ ] `app/admin/reservations/actions.ts` `updateReservationStatus` (requireAdmin + transitions + audit).
- [ ] Route `/admin/reservations` + `ReservationsClient` + badges + item sidebar.
- [ ] `LocationClient` câblé sur `validateReservation` ; `generateRef` supprimé.
- [ ] `AuditResourceType` étend `'reservation'`.
- [ ] Tests unit verts + typecheck + lint + build.
