# Boîte de réception des demandes (formulaires → base → back-office)

> Spec — 2026-06-27. Statut : validé (design), à implémenter.
> Feature **B** du chantier « contact / contribution ». Complète la feature **A**
> (coordonnées configurables, spec séparée). Indépendante de A.

## Contexte & objectif

Les formulaires publics (`/contact` et le RDV réparation `/reparation`)
**n'envoient qu'un email** au gérant (`sendLeadEmails`) — **rien n'est
persisté**. Si l'email échoue, le lead est perdu ; et il n'y a aucune trace
consultable.

Objectif : **persister chaque soumission** dans Firestore et la rendre
**consultable + gérable depuis le back-office** (lister, filtrer, changer le
statut, ajouter des notes internes).

## Périmètre

- **Formulaires couverts** : `/contact` (couvre l'intérêt véhicule/moto via les
  query params `?sujet=…&ref=…`) **et** le RDV réparation (`/reparation`).
- **Types de demandes** : `contact`, `vehicule`, `moto`, `piece`,
  `financement` (existants) **+ `reparation`** (ajouté).
- **Back-office** : page `/admin/demandes` (liste + détail + statuts + notes),
  activation de l'entrée nav « Demandes » (actuellement grisée).

## Non-objectifs

- Pas de notifications temps réel / push (l'email best-effort reste).
- Pas de réponse au client depuis le BO (le gérant rappelle/email à la main).
- Pas de gestion des pièces jointes (déjà signalées dans le message ; upload =
  chantier séparé, TODO existant inchangé).
- Réservations location : déjà couvertes par leur propre flux (`reservations`).

## Architecture (réutilise le pattern réservations existant)

### 1. Data model — collection Firestore `demandes`

Réutilise le type `Demande` existant (`lib/types.ts`) — **inchangé sauf** :

```ts
// AVANT : 'contact' | 'vehicule' | 'moto' | 'piece' | 'financement'
export type DemandeType =
  | 'contact'
  | 'vehicule'
  | 'moto'
  | 'piece'
  | 'financement'
  | 'reparation'; // ← ajouté
```

`Demande` : `{ id, type, status, nom, email, telephone, message, resourceRef?,
notes?, createdAt, updatedAt, expiresAt }`. `status` ∈ `'nouvelle' | 'en_cours'
| 'traitee' | 'deleted'`. `expiresAt` = TTL RGPD natif Firestore.

> Les détails structurés du RDV réparation (véhicule, prestation, date,
> créneau) sont **aplatis dans `message`** — schéma `Demande` inchangé (YAGNI).

### 2. Écriture publique — `createDemande`

Nouvelle méthode `DataAdapter.createDemande(data: Omit<Demande, 'id'>):
Promise<string>` :

- `FirebaseAdapter` → `addDoc(demandesRef, data)` (client SDK), retourne l'id.
- `StaticAdapter` → `warnDevFallback` + id factice (pas de persistance locale,
  comme les autres écritures dev).

Règle Firestore (`demandes`) : `allow create` public (formulaires non
authentifiés), `allow read, update if isAdmin()`, jamais `delete` (soft via
`status: 'deleted'`) — **même contrat que `reservations`/`orders`**.

### 3. Câblage des formulaires (persist d'abord, email best-effort)

Inversion de la robustesse actuelle : **le lead est sauvé avant tout**.

- **`app/contact/actions.ts` (`submitContact`)** :
  1. mappe `sujet` → `DemandeType` :
     `Vente véhicule→vehicule`, `Vente moto→moto`, `Devis réparation→reparation`,
     sinon `contact` ; `?financement=1` (via un champ transmis) → `financement`.
  2. `resourceRef` = `ref` (id véhicule/moto) si présent.
  3. `message` = message client + ligne « Sujet : … » + note pièces jointes.
  4. `createDemande({...})` **puis** `sendLeadEmails` en best-effort
     (try/catch : si l'email échoue, log + on renvoie quand même `ok` avec le
     `ref`, car le lead est persisté).
  5. si `createDemande` échoue → tenter l'email ; si tout échoue → erreur.
- **`app/reparation/actions.ts` (`submitRdv`)** : `type: 'reparation'`,
  `message` = détails RDV aplatis (`Véhicule: … · Prestation: … · Date: … ·
  Créneau: … · Description: …`). Même ordre persist→email.

> `ContactInput` gagne un champ optionnel `ref?: string` (déjà présent dans
> l'URL `?ref=`, à propager depuis `ContactForm`). `financement` est dérivé du
> sujet/param — pas de nouveau champ requis.

### 4. Lecture & gestion BO — Admin SDK (`lib/admin/demandes-server.ts`)

Miroir de `lib/admin/reservations-server.ts` :

- `getDemandesAdmin(opts?: { type?: DemandeType; status?: DemandeStatus; limit?: number }): Promise<Demande[]>` — `getAdminFirestore`, tri `createdAt desc`.
- Server action `updateDemandeStatus(id, status)` : `requireAdmin` →
  `update({ status, updatedAt })` → `writeAuditLog({ resourceType: 'demande',
  action: 'update' })` (diff PII-masqué, déjà géré) → `revalidatePath('/admin/demandes')`.
- Server action `saveDemandeNote(id, note)` : `requireAdmin` →
  `update({ notes, updatedAt })` → audit → revalidate.

`AuditResourceType` contient déjà `'demande'` — aucun ajout.

### 5. Page BO — `/admin/(shell)/demandes`

- `page.tsx` (server) : `requireAdmin()` → `getDemandesAdmin({ limit: 100 })` →
  `<DemandesClient demandes={…} />`. `export const dynamic = 'force-dynamic'`.
- `DemandesClient.tsx` (client, miroir `ReservationsClient`) :
  - **filtres segmentés** : type (Tous / Véhicule / Moto / Pièce / Réparation /
    Financement / Contact) + statut (Toutes / Nouvelles / En cours / Traitées).
  - **liste** : carte par demande (type badge, nom, sujet/extrait, date,
    statut) ; ligne dépliable → message complet, tél/email **cliquables**
    (`tel:` / `mailto:`), `resourceRef` (lien vers la fiche si véhicule/moto).
  - **actions** : transitions statut (nouvelle→en cours→traitée ; supprimer =
    `deleted`) via `updateDemandeStatus` ; zone notes internes via
    `saveDemandeNote`.
- **Activation nav** : `components/admin/AdminSidebar.tsx`, entrée `Demandes`
  passe `enabled: false` → `true`.

### 6. RGPD & sécurité

- `expiresAt` = `Date.now() + 13 mois` → purge auto (TTL natif ; script
  `scripts/setup-ttl-policies.ts` couvre déjà `expiresAt`, à vérifier/étendre
  à `demandes`).
- `notes` internes **jamais** exposées côté public (lecture admin only via rule).
- Pas de PII dans les logs ; audit diff masqué pour `resourceType === 'demande'`
  (déjà en place).

## Stratégie de test

- **Unit** :
  - `StaticAdapter.createDemande` → id factice + warn (pas de throw).
  - mapping `sujet → DemandeType` (fonction pure extraite, ex. `demandeTypeFromSujet`).
  - `submitContact` : persiste un `Demande` au bon type + `resourceRef` ;
    renvoie `ok` même si `sendLeadEmails` rejette (email best-effort).
  - `submitRdv` : persiste `type: 'reparation'` + message aplati ; `ok` si email KO.
  - `getDemandesAdmin` : applique les filtres type/statut.
  - `updateDemandeStatus` / `saveDemandeNote` : refus sans admin, update + audit.
- **Composant** : `DemandesClient` rend les demandes + filtre par statut.
- **E2E (léger)** : `/admin/demandes` accessible (smoke, StaticAdapter).

## Impact-map

- **Touche** : `lib/types.ts` (DemandeType +reparation), `lib/data/{types,static,firebase}.ts`
  (createDemande), `app/contact/actions.ts`, `app/contact/ContactForm.tsx`
  (propager `ref`), `app/reparation/actions.ts`, `firestore.rules` (demandes),
  `components/admin/AdminSidebar.tsx` (enabled), + nouveaux : `lib/admin/demandes-server.ts`,
  `app/admin/(shell)/demandes/page.tsx`, `components/admin/DemandesClient.tsx`,
  `scripts/setup-ttl-policies.ts` (étendre à demandes si absent).
- **Casse potentiellement** : `DemandeType` étendu → un `switch` exhaustif
  ailleurs casserait (à vérifier : aucun connu). Tests fixtures `getDemandes`.
- **Doit préserver** : aucun lead perdu (persist avant email) ; l'email
  best-effort continue de notifier ; statut initial `nouvelle` ; soft-delete
  only ; notes admin-only ; design iOS Clarity au BO.
