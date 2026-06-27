# Coordonnées de contact configurables depuis le back-office

> Spec — 2026-06-27. Statut : validé (design), à implémenter.
> Feature **A** du chantier « contact / contribution ». La feature **B**
> (boîte de réception des demandes : persistance des formulaires + page BO)
> fera l'objet d'une spec séparée.

## Contexte & objectif

Les coordonnées du garage (téléphone, email, WhatsApp, adresse, horaires)
sont aujourd'hui **codées en dur** dans `lib/seo.ts` (objet `BUSINESS`) et
`lib/config.ts` (`WHATSAPP_NUMBER` via variable d'env). Les changer impose une
modification de code + un redéploiement.

Objectif : rendre ces coordonnées **éditables depuis le back-office**, avec
effet **live** sur le front (footer, page contact, fiches véhicule/moto) **et
sur le JSON-LD SEO** (`AutoRepair`/`LocalBusiness`), sans redéploiement.

## Périmètre

**Éditable depuis le BO :** `phone` (E.164) + `phoneDisplay` (lisible),
`email`, `whatsappNumber`, `address` (rue / CP / ville / région), `hours`
(ouverture/fermeture semaine + samedi).

**Hors périmètre (restent en dur comme défauts) :** `name`, `geo` (GPS),
`sameAs` (réseaux sociaux), `priceRange`. Non demandés (YAGNI). Pourront être
ajoutés plus tard sur le même socle.

## Non-objectifs

- Pas d'historique/versioning des coordonnées (un seul état courant ; l'audit
  log conserve la trace des modifications).
- Pas de coordonnées multi-établissements (un seul garage).
- Feature B (réception des formulaires en base) : spec séparée.

## Architecture (réutilise le pattern feature-flags)

### 1. Data model — Firestore `meta/contactInfo`

```ts
// meta/contactInfo
{
  phone: string,          // E.164, ex "+590690112233" — liens tel:
  phoneDisplay: string,   // lisible, ex "0690 11 22 33" — affichage
  email: string,
  whatsappNumber: string, // sans "+", ex "590690112233" — liens wa.me
  address: {
    street: string,
    postalCode: string,
    city: string,
    region: string,
  },
  hours: {
    weekdayOpen: string,   // "07:30"
    weekdayClose: string,  // "17:30"
    saturdayOpen: string,  // "08:00"
    saturdayClose: string, // "13:00"
  },
  updatedAt: number,
  updatedBy: string,       // email admin
}
```

> `country` (FR) et le dimanche (fermé) restent implicites/constants — pas
> d'intérêt à les éditer.

### 2. Module cœur — `lib/contact-info.ts`

```ts
export type ContactInfo = { /* champs ci-dessus, sans updatedAt/updatedBy */ };

export const DEFAULT_CONTACT_INFO: ContactInfo; // = valeurs actuelles de BUSINESS + WHATSAPP_NUMBER

export function normalizeContactInfo(raw: Partial<ContactInfo> | null | undefined): ContactInfo;

// Helpers dérivés (consommés par l'UI + le JSON-LD) :
export function addressOneLine(ci: ContactInfo): string;     // "rue, CP ville, région"
export function whatsappUrl(ci: ContactInfo): string;        // "https://wa.me/<num>"
export function openingHoursSpec(ci: ContactInfo): {         // forme schema.org
  days: string[]; opens: string; closes: string;
}[];
```

Validation : `ContactInfoSchema` (Zod) — `email` format email, `phone` commence
par `+`, `whatsappNumber` numérique, champs requis non vides. Utilisé par
l'action BO ; en lecture, `normalizeContactInfo` merge sur les défauts (tolérant).

### 3. Lecture cachée — `lib/data/contact-info-cache.ts`

```ts
export const getCachedContactInfo = unstable_cache(
  async (): Promise<ContactInfo> => {
    const adapter = await getAdapter();
    return adapter.getContactInfo();
  },
  ['contact-info'],
  { tags: ['contact-info'] }
);
```

`DataAdapter.getContactInfo(): Promise<ContactInfo>` :
- `StaticAdapter` → `DEFAULT_CONTACT_INFO`.
- `FirebaseAdapter` → lit `meta/contactInfo`, `normalizeContactInfo(snap.data())`,
  **fail-open** sur les défauts en cas d'erreur (le root layout l'await sur
  chaque page — ne jamais casser le site).

### 4. Refactor des consommateurs

`BUSINESS` / `ADDRESS_ONE_LINE` restent dans `lib/seo.ts` comme **source des
défauts** (réexportés dans `DEFAULT_CONTACT_INFO`). Les consommateurs lisent
désormais la valeur fusionnée :

- **`lib/seo.ts`** : `localBusinessJsonLd`, `organizationJsonLd`, `websiteJsonLd`
  prennent un paramètre `contactInfo: ContactInfo` (au lieu d'importer
  `BUSINESS`). `geo`/`priceRange`/`name` viennent toujours des constantes.
- **`app/layout.tsx`** : lit `getCachedContactInfo()` → passe aux fonctions
  JSON-LD du `<JsonLd>`.
- **Pages serveur** (`app/page.tsx`, `app/contact/page.tsx`,
  `app/vente-vehicule/[id]/page.tsx`, `app/vente-moto/[id]/page.tsx`) : lisent
  `getCachedContactInfo()` et utilisent `ci.*` + helpers
  (`addressOneLine`, `whatsappUrl`).

> Tous les consommateurs actuels de `BUSINESS`/`WHATSAPP_URL` sont des **server
> components** → pas de provider client nécessaire (plus simple que les flags).
> Si un futur composant client a besoin des coordonnées, ajouter un
> `ContactInfoProvider` (même pattern que `FeatureFlagsProvider`).

### 5. Page BO — `/admin/parametres` (2e carte)

La page Paramètres existante (qui porte déjà « Visibilité des sections »)
reçoit une **2e carte « Coordonnées »** :
- Server component : lit `meta/contactInfo` via `getAdminFirestore` (+ défauts).
- `ContactInfoForm` (client) : champs tél / phoneDisplay / email / WhatsApp /
  adresse (×4) / horaires (×4), design iOS Clarity.
- Server action `updateContactInfo(prev, formData)` :
  `requireAdmin` → `ContactInfoSchema.safeParse` (erreurs renvoyées au form) →
  `set('meta/contactInfo', { ...data, updatedAt, updatedBy }, { merge: true })`
  → `writeAuditLog({ resourceType: 'contact-info', action: 'update' })` →
  `revalidateTag('contact-info')` + `revalidatePath('/', 'layout')`.

`AuditResourceType` (`lib/admin/audit.ts`) gagne la valeur `'contact-info'`.

### 6. Règle Firestore

```
match /meta/contactInfo {
  allow read;                 // storefront + JSON-LD lisent les coordonnées
  allow write: if isAdmin();  // édition BO seulement (défense en profondeur)
}
```

(L'écriture passe par l'Admin SDK qui contourne les rules ; la règle bloque
toute écriture client directe.) À déployer avec
`firebase deploy --only firestore:rules`.

### 7. Cache & SEO

Pages storefront en ISR/static : le tag `'contact-info'` invalidé à
l'enregistrement régénère footer, page contact, fiches **et le JSON-LD** →
NAP (Name/Address/Phone) cohérent partout, SEO local à jour sans redéploiement.

## Stratégie de test

- **Unit** : `DEFAULT_CONTACT_INFO` = valeurs `BUSINESS` ; `normalizeContactInfo`
  (merge partiel, null → défauts) ; helpers `addressOneLine` / `whatsappUrl` /
  `openingHoursSpec` ; `ContactInfoSchema` (rejette email/tel invalides).
- **Adapter** : `StaticAdapter.getContactInfo` → défauts.
- **JSON-LD** : `localBusinessJsonLd(ci)` reflète les champs de `ci`
  (telephone/email/address/openingHours).
- **Action** : `updateContactInfo` refuse sans admin ; écrit le doc ; rejette
  un payload invalide (erreurs au form) ; appelle `revalidateTag('contact-info')`.
- **Formulaire** : `ContactInfoForm` rend les valeurs initiales dans les champs.
- **E2E (léger)** : page contact affiche un téléphone/email (non-régression
  avec StaticAdapter = défauts).

## Impact-map

- **Touche** : `lib/contact-info.ts` (nouveau), `lib/data/{types,static,firebase}.ts`,
  `lib/data/contact-info-cache.ts` (nouveau), `lib/seo.ts` (signatures JSON-LD),
  `app/layout.tsx`, `app/page.tsx`, `app/contact/page.tsx`,
  `app/vente-vehicule/[id]/page.tsx`, `app/vente-moto/[id]/page.tsx`,
  `app/admin/(shell)/parametres/page.tsx` + `actions.ts`,
  `components/admin/ContactInfoForm.tsx` (nouveau), `lib/admin/audit.ts`,
  `firestore.rules`.
- **Casse potentiellement** : tests existants sur le JSON-LD (signatures
  changées) et sur les pages consommatrices → à mettre à jour.
- **Doit préserver** : le NAP identique partout (front + JSON-LD) ; les défauts
  garantissent zéro régression si Firestore vide ; aucune fuite des champs non
  édités (geo/réseaux/priceRange inchangés) ; design systems non mixés.
