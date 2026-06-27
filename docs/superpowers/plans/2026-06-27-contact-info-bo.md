# Coordonnées de contact configurables — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les coordonnées du garage (tél, email, WhatsApp, adresse, horaires, GPS, réseaux) éditables depuis le back-office, avec effet live sur le front et le JSON-LD SEO, sans redéploiement.

**Architecture:** Doc Firestore `meta/contactInfo` lu via `unstable_cache` (tag `contact-info`), avec les valeurs actuelles de `BUSINESS` comme défauts (fail-open). Les consommateurs (JSON-LD, footer home, page contact, fiches véhicule/moto) lisent la valeur fusionnée au lieu d'importer la constante. Édition via une 2e carte sur `/admin/parametres`. Même pattern que les feature flags déjà livrés.

**Tech Stack:** Next.js 14.2 App Router, React 18, TypeScript 5.4, Firestore (client SDK lecture / Admin SDK écriture), Zod, Vitest + happy-dom + RTL, Playwright.

## Global Constraints

- Champs éditables : `phone` (E.164), `phoneDisplay`, `email`, `whatsappNumber` (sans `+`), `address` (street/postalCode/city/region), `hours` (weekdayOpen/weekdayClose/saturdayOpen/saturdayClose), `geo` (lat/lng), `social` (facebook/instagram/google). **Non éditables** : `name`, `priceRange`, `country` (FR).
- Défaut si doc Firestore absent = valeurs `BUSINESS` (jamais de site cassé).
- `getContactInfo` (FirebaseAdapter) est **fail-open** : toute erreur → défauts.
- Le NAP (Name/Address/Phone) doit rester identique entre front et JSON-LD.
- Locale FR, design systems non mixés (iOS Clarity au BO).
- Imports ordonnés React → Next.js → lib/ → components/ → types (dernier).
- TDD strict : test rouge → impl minimale → test vert → commit. `--no-verify` interdit en commit final (le hook prettier doit passer).

---

### Task 1: Module cœur `lib/contact-info.ts`

**Files:**

- Create: `lib/contact-info.ts`
- Test: `tests/unit/contact-info.test.ts`

**Interfaces:**

- Consumes: `BUSINESS` (`@/lib/seo`), `WHATSAPP_NUMBER` (`@/lib/config`).
- Produces:
  - `type ContactInfo`
  - `const DEFAULT_CONTACT_INFO: ContactInfo`
  - `function normalizeContactInfo(raw): ContactInfo`
  - `function addressOneLine(ci): string`
  - `function whatsappUrl(ci): string`
  - `function openingHoursSpec(ci): { days: string[]; opens: string; closes: string }[]`
  - `function sameAs(ci): string[]`
  - `const ContactInfoSchema` (Zod)

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/contact-info.test.ts
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONTACT_INFO,
  normalizeContactInfo,
  addressOneLine,
  whatsappUrl,
  openingHoursSpec,
  sameAs,
  ContactInfoSchema,
} from '@/lib/contact-info';

describe('contact-info', () => {
  it('défauts cohérents (champs requis présents)', () => {
    expect(DEFAULT_CONTACT_INFO.phone.startsWith('+')).toBe(true);
    expect(DEFAULT_CONTACT_INFO.address.city).toBeTruthy();
    expect(DEFAULT_CONTACT_INFO.hours.weekdayOpen).toMatch(/^\d{2}:\d{2}$/);
    expect(typeof DEFAULT_CONTACT_INFO.geo.lat).toBe('number');
    expect(DEFAULT_CONTACT_INFO.social).toEqual({ facebook: '', instagram: '', google: '' });
  });

  it('normalize merge un doc partiel sur les défauts', () => {
    const r = normalizeContactInfo({ email: 'x@y.gp', social: { facebook: 'https://fb.com/x' } });
    expect(r.email).toBe('x@y.gp');
    expect(r.phone).toBe(DEFAULT_CONTACT_INFO.phone);
    expect(r.social.facebook).toBe('https://fb.com/x');
    expect(r.social.instagram).toBe('');
  });

  it('normalize null/undefined → défauts', () => {
    expect(normalizeContactInfo(null)).toEqual(DEFAULT_CONTACT_INFO);
    expect(normalizeContactInfo(undefined)).toEqual(DEFAULT_CONTACT_INFO);
  });

  it('addressOneLine', () => {
    const ci = normalizeContactInfo({
      address: { street: 'Rue A', postalCode: '97110', city: 'Pointe', region: 'Guadeloupe' },
    });
    expect(addressOneLine(ci)).toBe('Rue A, 97110 Pointe, Guadeloupe');
  });

  it('whatsappUrl', () => {
    const ci = normalizeContactInfo({ whatsappNumber: '590690112233' });
    expect(whatsappUrl(ci)).toBe('https://wa.me/590690112233');
  });

  it('openingHoursSpec → 2 plages schema.org', () => {
    const spec = openingHoursSpec(DEFAULT_CONTACT_INFO);
    expect(spec).toHaveLength(2);
    expect(spec[0].days).toContain('Monday');
    expect(spec[1].days).toEqual(['Saturday']);
  });

  it('sameAs filtre les liens vides', () => {
    const ci = normalizeContactInfo({
      social: { facebook: 'https://fb.com/x', instagram: '', google: 'https://g.page/x' },
    });
    expect(sameAs(ci)).toEqual(['https://fb.com/x', 'https://g.page/x']);
  });

  it('ContactInfoSchema rejette email/tel invalides, accepte social vide', () => {
    const base = {
      phone: '+590690112233',
      phoneDisplay: '0690 11 22 33',
      email: 'contact@car.gp',
      whatsappNumber: '590690112233',
      address: { street: 'R', postalCode: '97110', city: 'P', region: 'Guadeloupe' },
      hours: {
        weekdayOpen: '07:30',
        weekdayClose: '17:30',
        saturdayOpen: '08:00',
        saturdayClose: '13:00',
      },
      geo: { lat: 16.2, lng: -61.5 },
      social: { facebook: '', instagram: '', google: '' },
    };
    expect(ContactInfoSchema.safeParse(base).success).toBe(true);
    expect(ContactInfoSchema.safeParse({ ...base, email: 'pasunemail' }).success).toBe(false);
    expect(ContactInfoSchema.safeParse({ ...base, phone: '0690' }).success).toBe(false);
    expect(
      ContactInfoSchema.safeParse({
        ...base,
        social: { facebook: 'pasurl', instagram: '', google: '' },
      }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/contact-info.test.ts`
Expected: FAIL — `Cannot find module '@/lib/contact-info'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/contact-info.ts
// Coordonnées du garage : lues par le storefront + le JSON-LD, éditées au BO.
// Source de défauts = BUSINESS (lib/seo) ; l'override vient de Firestore.
import { z } from 'zod';
import { BUSINESS } from '@/lib/seo';
import { WHATSAPP_NUMBER } from '@/lib/config';

export type ContactInfo = {
  phone: string;
  phoneDisplay: string;
  email: string;
  whatsappNumber: string;
  address: { street: string; postalCode: string; city: string; region: string };
  hours: { weekdayOpen: string; weekdayClose: string; saturdayOpen: string; saturdayClose: string };
  geo: { lat: number; lng: number };
  social: { facebook: string; instagram: string; google: string };
};

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  phone: BUSINESS.phone,
  phoneDisplay: BUSINESS.phoneDisplay,
  email: BUSINESS.email,
  whatsappNumber: WHATSAPP_NUMBER,
  address: {
    street: BUSINESS.address.street,
    postalCode: BUSINESS.address.postalCode,
    city: BUSINESS.address.city,
    region: BUSINESS.address.region,
  },
  hours: {
    weekdayOpen: '07:30',
    weekdayClose: '17:30',
    saturdayOpen: '08:00',
    saturdayClose: '13:00',
  },
  geo: { lat: BUSINESS.geo.lat, lng: BUSINESS.geo.lng },
  social: { facebook: '', instagram: '', google: '' },
};

const isStr = (v: unknown): v is string => typeof v === 'string';

export function normalizeContactInfo(raw: Partial<ContactInfo> | null | undefined): ContactInfo {
  const d = DEFAULT_CONTACT_INFO;
  const s = raw ?? {};
  return {
    phone: isStr(s.phone) ? s.phone : d.phone,
    phoneDisplay: isStr(s.phoneDisplay) ? s.phoneDisplay : d.phoneDisplay,
    email: isStr(s.email) ? s.email : d.email,
    whatsappNumber: isStr(s.whatsappNumber) ? s.whatsappNumber : d.whatsappNumber,
    address: {
      street: isStr(s.address?.street) ? s.address!.street : d.address.street,
      postalCode: isStr(s.address?.postalCode) ? s.address!.postalCode : d.address.postalCode,
      city: isStr(s.address?.city) ? s.address!.city : d.address.city,
      region: isStr(s.address?.region) ? s.address!.region : d.address.region,
    },
    hours: {
      weekdayOpen: isStr(s.hours?.weekdayOpen) ? s.hours!.weekdayOpen : d.hours.weekdayOpen,
      weekdayClose: isStr(s.hours?.weekdayClose) ? s.hours!.weekdayClose : d.hours.weekdayClose,
      saturdayOpen: isStr(s.hours?.saturdayOpen) ? s.hours!.saturdayOpen : d.hours.saturdayOpen,
      saturdayClose: isStr(s.hours?.saturdayClose) ? s.hours!.saturdayClose : d.hours.saturdayClose,
    },
    geo: {
      lat: typeof s.geo?.lat === 'number' ? s.geo!.lat : d.geo.lat,
      lng: typeof s.geo?.lng === 'number' ? s.geo!.lng : d.geo.lng,
    },
    social: {
      facebook: isStr(s.social?.facebook) ? s.social!.facebook : d.social.facebook,
      instagram: isStr(s.social?.instagram) ? s.social!.instagram : d.social.instagram,
      google: isStr(s.social?.google) ? s.social!.google : d.social.google,
    },
  };
}

export function addressOneLine(ci: ContactInfo): string {
  const a = ci.address;
  return `${a.street}, ${a.postalCode} ${a.city}, ${a.region}`;
}

export function whatsappUrl(ci: ContactInfo): string {
  return `https://wa.me/${ci.whatsappNumber}`;
}

export function openingHoursSpec(
  ci: ContactInfo
): { days: string[]; opens: string; closes: string }[] {
  return [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: ci.hours.weekdayOpen,
      closes: ci.hours.weekdayClose,
    },
    { days: ['Saturday'], opens: ci.hours.saturdayOpen, closes: ci.hours.saturdayClose },
  ];
}

export function sameAs(ci: ContactInfo): string[] {
  return [ci.social.facebook, ci.social.instagram, ci.social.google].filter((u) => u.length > 0);
}

const urlOrEmpty = z.string().refine((v) => v === '' || /^https?:\/\/.+/.test(v), {
  message: 'URL invalide',
});

export const ContactInfoSchema = z.object({
  phone: z.string().regex(/^\+\d{6,}$/, 'Téléphone E.164 invalide (ex +590690112233)'),
  phoneDisplay: z.string().min(1),
  email: z.string().email(),
  whatsappNumber: z.string().regex(/^\d{6,}$/, 'Numéro WhatsApp invalide'),
  address: z.object({
    street: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    region: z.string().min(1),
  }),
  hours: z.object({
    weekdayOpen: z.string().regex(/^\d{2}:\d{2}$/),
    weekdayClose: z.string().regex(/^\d{2}:\d{2}$/),
    saturdayOpen: z.string().regex(/^\d{2}:\d{2}$/),
    saturdayClose: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  geo: z.object({ lat: z.number().finite(), lng: z.number().finite() }),
  social: z.object({ facebook: urlOrEmpty, instagram: urlOrEmpty, google: urlOrEmpty }),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/contact-info.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/contact-info.ts tests/unit/contact-info.test.ts
git commit -m "feat(contact): module cœur contact-info (type + défauts + helpers + schema)"
```

---

### Task 2: Adapter `getContactInfo` + lecture cachée

**Files:**

- Modify: `lib/data/types.ts`, `lib/data/static.ts`, `lib/data/firebase.ts`
- Create: `lib/data/contact-info-cache.ts`
- Test: `tests/unit/contact-info-adapter.test.ts`, mise à jour `tests/unit/data-adapter.test.ts`

**Interfaces:**

- Consumes: `ContactInfo`, `DEFAULT_CONTACT_INFO`, `normalizeContactInfo` (Task 1).
- Produces: `DataAdapter.getContactInfo(): Promise<ContactInfo>`, `getCachedContactInfo()`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/contact-info-adapter.test.ts
import { describe, it, expect } from 'vitest';
import { StaticAdapter } from '@/lib/data/static';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';

describe('StaticAdapter.getContactInfo', () => {
  it('renvoie les défauts', async () => {
    await expect(new StaticAdapter().getContactInfo()).resolves.toEqual(DEFAULT_CONTACT_INFO);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/contact-info-adapter.test.ts`
Expected: FAIL — `getContactInfo is not a function`.

- [ ] **Step 3: Write minimal implementation**

Dans `lib/data/types.ts` : ajouter l'import et la méthode à l'interface `DataAdapter`, juste après `getFeatureFlags(): Promise<FeatureFlags>;` :

```ts
// en tête, avec les autres imports de type :
import type { ContactInfo } from '@/lib/contact-info';

// dans l'interface DataAdapter, après getFeatureFlags :
  getContactInfo(): Promise<ContactInfo>;
```

Dans `lib/data/static.ts` (après la méthode `getFeatureFlags`) :

```ts
// en tête :
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';

// dans la classe :
  async getContactInfo(): Promise<ContactInfo> {
    return { ...DEFAULT_CONTACT_INFO };
  }
```

Dans `lib/data/firebase.ts` (après la méthode `getFeatureFlags`) :

```ts
// en tête :
import { normalizeContactInfo } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';

// dans la classe FirebaseAdapter :
  async getContactInfo(): Promise<ContactInfo> {
    // Fail-open : ne jamais casser le site si la lecture échoue.
    try {
      const snap = await getDoc(doc(db, 'meta', 'contactInfo'));
      return normalizeContactInfo(snap.exists() ? (snap.data() as Partial<ContactInfo>) : null);
    } catch (err) {
      console.error('[contact-info] lecture meta/contactInfo échouée, défauts appliqués:', err);
      return normalizeContactInfo(null);
    }
  }
```

Créer `lib/data/contact-info-cache.ts` :

```ts
import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { ContactInfo } from '@/lib/contact-info';

/**
 * Coordonnées publiques, cachées et invalidables par tag.
 * `revalidateTag('contact-info')` (action BO) régénère footer/contact/fiches/JSON-LD.
 */
export const getCachedContactInfo = unstable_cache(
  async (): Promise<ContactInfo> => {
    const adapter = await getAdapter();
    return adapter.getContactInfo();
  },
  ['contact-info'],
  { tags: ['contact-info'] }
);
```

Mettre à jour les **2 mocks** `DataAdapter` de `tests/unit/data-adapter.test.ts` : juste après chaque ligne `getFeatureFlags: async () => ({ ... }),` ajouter :

```ts
      getContactInfo: async () => ({
        phone: '+590690112233',
        phoneDisplay: '0690 11 22 33',
        email: 'c@c.gp',
        whatsappNumber: '590690112233',
        address: { street: 'R', postalCode: '97110', city: 'P', region: 'Guadeloupe' },
        hours: { weekdayOpen: '07:30', weekdayClose: '17:30', saturdayOpen: '08:00', saturdayClose: '13:00' },
        geo: { lat: 16.2, lng: -61.5 },
        social: { facebook: '', instagram: '', google: '' },
      }),
```

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/contact-info-adapter.test.ts tests/unit/data-adapter.test.ts && npx tsc --noEmit`
Expected: tests PASS ; tsc sans nouvelle erreur.

- [ ] **Step 5: Commit**

```bash
git add lib/data/types.ts lib/data/static.ts lib/data/firebase.ts lib/data/contact-info-cache.ts tests/unit/contact-info-adapter.test.ts tests/unit/data-adapter.test.ts
git commit -m "feat(contact): adapter getContactInfo + lecture cachée (fail-open)"
```

---

### Task 3: Règle Firestore — lecture publique `meta/contactInfo`

**Files:**

- Modify: `firestore.rules`

- [ ] **Step 1: Ajouter la règle**

Dans `firestore.rules`, juste **après** le bloc `match /meta/featureFlags { … }` (et avant `match /meta/{doc=**}`), insérer :

```
    // Coordonnées de contact : lecture publique (storefront + JSON-LD),
    // écriture admin seulement.
    match /meta/contactInfo {
      allow read;
      allow write: if isAdmin();
    }
```

- [ ] **Step 2: Vérifier l'équilibre des accolades**

Run: `bash -c 'o=$(grep -o "{" firestore.rules | wc -l); c=$(grep -o "}" firestore.rules | wc -l); echo "{ $o } $c"'`
Expected: les deux nombres sont égaux.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(contact): règle Firestore lecture publique meta/contactInfo"
```

> Déploiement (`firebase deploy --only firestore:rules`) = étape ops, au déploiement global.

---

### Task 4: Refactor JSON-LD (`lib/seo.ts`) pour prendre `ContactInfo`

**Files:**

- Modify: `lib/seo.ts`
- Test: `tests/unit/contact-info-jsonld.test.ts`

**Interfaces:**

- Consumes: `ContactInfo`, `addressOneLine`, `openingHoursSpec`, `sameAs` (Task 1).
- Produces: `localBusinessJsonLd(ci: ContactInfo)`, `organizationJsonLd(ci: ContactInfo)` (signatures changées). `websiteJsonLd()` inchangée.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/contact-info-jsonld.test.ts
import { describe, it, expect } from 'vitest';
import { localBusinessJsonLd, organizationJsonLd } from '@/lib/seo';
import { normalizeContactInfo } from '@/lib/contact-info';

describe('JSON-LD reflète ContactInfo', () => {
  const ci = normalizeContactInfo({
    phone: '+590690112233',
    email: 'x@y.gp',
    geo: { lat: 16.99, lng: -61.99 },
    social: { facebook: 'https://fb.com/x', instagram: '', google: '' },
  });

  it('localBusinessJsonLd reflète téléphone/email/geo/sameAs', () => {
    const ld = localBusinessJsonLd(ci);
    expect(ld.telephone).toBe('+590690112233');
    expect(ld.email).toBe('x@y.gp');
    expect(ld.geo.latitude).toBe(16.99);
    expect(ld.sameAs).toEqual(['https://fb.com/x']);
    expect(ld.openingHoursSpecification).toHaveLength(2);
  });

  it('organizationJsonLd reflète sameAs', () => {
    expect(organizationJsonLd(ci).sameAs).toEqual(['https://fb.com/x']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/contact-info-jsonld.test.ts`
Expected: FAIL — `localBusinessJsonLd` n'accepte pas d'argument / renvoie les valeurs `BUSINESS`.

- [ ] **Step 3: Write minimal implementation**

Dans `lib/seo.ts` :

```ts
// en tête (après les autres imports) :
import { addressOneLine, openingHoursSpec, sameAs } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';
```

Remplacer `localBusinessJsonLd()` par une version paramétrée (le `postalAddress` est construit depuis `ci`) :

```ts
export function localBusinessJsonLd(ci: ContactInfo) {
  const social = sameAs(ci);
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    url: SITE_URL,
    image: absoluteUrl('/opengraph-image.png'),
    logo: absoluteUrl('/images/logo-carperformance.svg'),
    telephone: ci.phone,
    email: ci.email,
    priceRange: BUSINESS.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ci.address.street,
      postalCode: ci.address.postalCode,
      addressLocality: ci.address.city,
      addressRegion: ci.address.region,
      addressCountry: BUSINESS.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: ci.geo.lat, longitude: ci.geo.lng },
    areaServed: { '@type': 'AdministrativeArea', name: 'Guadeloupe' },
    openingHoursSpecification: openingHoursSpec(ci).map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    ...(social.length ? { sameAs: social } : {}),
  };
}
```

Remplacer `organizationJsonLd()` par :

```ts
export function organizationJsonLd(ci: ContactInfo) {
  const social = sameAs(ci);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    url: SITE_URL,
    logo: absoluteUrl('/images/logo-carperformance.svg'),
    ...(social.length ? { sameAs: social } : {}),
  };
}
```

> Garder le `const postalAddress = {…}` existant **uniquement s'il est encore
> référencé ailleurs** ; sinon le supprimer (il était utilisé par
> `localBusinessJsonLd`). `websiteJsonLd()` et `breadcrumbJsonLd()` restent
> inchangées. `addressOneLine` importé n'est pas utilisé dans seo.ts → ne pas
> l'importer si non utilisé (éviter le warning lint) ; n'importer que
> `openingHoursSpec` et `sameAs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/contact-info-jsonld.test.ts`
Expected: PASS (2 tests). (tsc sera vérifié en Task 5 une fois les appelants mis à jour.)

- [ ] **Step 5: Commit**

```bash
git add lib/seo.ts tests/unit/contact-info-jsonld.test.ts
git commit -m "feat(contact): JSON-LD paramétré par ContactInfo"
```

---

### Task 5: Câbler les consommateurs (layout + 4 pages)

**Files:**

- Modify: `app/layout.tsx`, `app/page.tsx`, `app/contact/page.tsx`, `app/vente-vehicule/[id]/page.tsx`, `app/vente-moto/[id]/page.tsx`

**Interfaces:**

- Consumes: `getCachedContactInfo` (Task 2), helpers `addressOneLine`/`whatsappUrl` (Task 1), `localBusinessJsonLd`/`organizationJsonLd` (Task 4).

- [ ] **Step 1 : `app/layout.tsx`**

Ajouter l'import et lire les coordonnées (le layout est déjà `async`) :

```ts
// imports :
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';

// dans RootLayout, après `const featureFlags = await getCachedFeatureFlags();` :
const contactInfo = await getCachedContactInfo();
```

Remplacer la ligne `<JsonLd … />` par :

```tsx
<JsonLd
  data={[localBusinessJsonLd(contactInfo), organizationJsonLd(contactInfo), websiteJsonLd()]}
/>
```

- [ ] **Step 2 : `app/page.tsx`**

Remplacer les imports `BUSINESS, ADDRESS_ONE_LINE` (seo) et `WHATSAPP_URL` (config) par les helpers, et lire `ci`. En tête, retirer `import { WHATSAPP_URL } from '@/lib/config';` et adapter l'import seo ; ajouter :

```ts
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';
import { addressOneLine, whatsappUrl } from '@/lib/contact-info';
```

Dans `HomePage` (déjà `async`), après la lecture des flags, ajouter :

```ts
const ci = await getCachedContactInfo();
```

Puis remplacer les usages :

- `tel:${BUSINESS.phone}` → `tel:${ci.phone}`
- `BUSINESS.phoneDisplay` → `ci.phoneDisplay`
- `WHATSAPP_URL` → `whatsappUrl(ci)`
- `{ADDRESS_ONE_LINE}` → `{addressOneLine(ci)}`

Si `BUSINESS` n'est plus utilisé dans le fichier, retirer son import.

- [ ] **Step 3 : `app/contact/page.tsx`**

Passer la page en `async` et lire `ci` :

```ts
// imports : retirer `import { BUSINESS, ADDRESS_ONE_LINE } from '@/lib/seo';`
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';
import { addressOneLine } from '@/lib/contact-info';

// signature :
export default async function ContactPage() {
  const ci = await getCachedContactInfo();
  // …
}
```

Remplacer : `ADDRESS_ONE_LINE` → `addressOneLine(ci)` (3 occurrences, dont celle dans l'URL Google Maps `encodeURIComponent(addressOneLine(ci))`), `BUSINESS.phoneDisplay` → `ci.phoneDisplay`, `BUSINESS.email` → `ci.email`.

- [ ] **Step 4 : `app/vente-vehicule/[id]/page.tsx`**

Lire `ci` dans `generateMetadata` et dans la page. Ajouter aux imports :

```ts
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';
```

Dans `generateMetadata` : `const ci = await getCachedContactInfo();` puis `BUSINESS.address.city` → `ci.address.city`.
Dans `VehiculeDetailPage` : `const ci = await getCachedContactInfo();` puis dans le JSON-LD inline remplacer `BUSINESS.name` → `BUSINESS.name` (constant, inchangé), `BUSINESS.address.{city,postalCode,region}` → `ci.address.{city,postalCode,region}`, `BUSINESS.address.country` reste, et `tel:${BUSINESS.phone}` → `tel:${ci.phone}`.

> `BUSINESS.name` et `BUSINESS.address.country` restent (non éditables) → garder l'import `BUSINESS`.

- [ ] **Step 5 : `app/vente-moto/[id]/page.tsx`**

Identique à la fiche véhicule : ajouter l'import `getCachedContactInfo`, lire `const ci = await getCachedContactInfo();` dans `MotoDetailPage`, remplacer dans le JSON-LD inline `BUSINESS.address.{city,postalCode,region}` → `ci.address.*` et `tel:${BUSINESS.phone}` → `tel:${ci.phone}`. Garder `BUSINESS.name`/`country`.

- [ ] **Step 6 : typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: tsc propre (hors bruit `Cannot find type definition file`) ; build vert.

- [ ] **Step 7 : Commit**

```bash
git add app/layout.tsx app/page.tsx app/contact/page.tsx "app/vente-vehicule/[id]/page.tsx" "app/vente-moto/[id]/page.tsx"
git commit -m "feat(contact): consommateurs (layout JSON-LD + home + contact + fiches) lisent ContactInfo"
```

---

### Task 6: Server Action `updateContactInfo` + type d'audit

**Files:**

- Modify: `lib/admin/audit.ts`, `app/admin/(shell)/parametres/actions.ts`
- Test: `tests/unit/contact-info-action.test.ts`

**Interfaces:**

- Consumes: `requireAdmin`, `writeAuditLog`, `getAdminFirestore`, `ContactInfoSchema` (Task 1), `FormActionState`.
- Produces: `updateContactInfo(prev, formData): Promise<FormActionState>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/contact-info-action.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const setMock = vi.fn(async () => undefined);
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ uid: 'u1', email: 'admin@test.gp' })),
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ doc: () => ({ set: setMock }) })),
}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

import { requireAdmin } from '@/lib/admin/auth';
import { revalidateTag } from 'next/cache';
import { updateContactInfo } from '@/app/admin/(shell)/parametres/actions';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

const valid = {
  phone: '+590690112233',
  phoneDisplay: '0690 11 22 33',
  email: 'contact@car.gp',
  whatsappNumber: '590690112233',
  street: 'Rue A',
  postalCode: '97110',
  city: 'Pointe',
  region: 'Guadeloupe',
  weekdayOpen: '07:30',
  weekdayClose: '17:30',
  saturdayOpen: '08:00',
  saturdayClose: '13:00',
  lat: '16.2',
  lng: '-61.5',
  facebook: '',
  instagram: '',
  google: '',
};

describe('updateContactInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('écrit le doc + audit + revalide', async () => {
    const res = await updateContactInfo(null, fd(valid));
    expect(requireAdmin).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'contact@car.gp', updatedBy: 'admin@test.gp' }),
      { merge: true }
    );
    expect(revalidateTag).toHaveBeenCalledWith('contact-info');
    expect(res).toEqual({ ok: true, message: expect.any(String) });
  });

  it("payload invalide → erreurs, pas d'écriture", async () => {
    const res = await updateContactInfo(null, fd({ ...valid, email: 'pasunemail' }));
    expect(setMock).not.toHaveBeenCalled();
    expect(res).toHaveProperty('errors');
  });

  it('refuse sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Non authentifié'));
    await expect(updateContactInfo(null, fd(valid))).rejects.toThrow('Non authentifié');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/contact-info-action.test.ts`
Expected: FAIL — `updateContactInfo` introuvable.

- [ ] **Step 3: Write minimal implementation**

Dans `lib/admin/audit.ts` : ajouter `'contact-info'` au union `AuditResourceType` (après `'feature-flags'`) :

```ts
  | 'feature-flags'
  | 'contact-info';
```

Dans `app/admin/(shell)/parametres/actions.ts`, ajouter (en gardant `toggleFeatureFlags`) :

```ts
// en tête (à côté des imports existants) :
import { ContactInfoSchema } from '@/lib/contact-info';

export async function updateContactInfo(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const str = (k: string) => String(formData.get(k) ?? '').trim();
  const candidate = {
    phone: str('phone'),
    phoneDisplay: str('phoneDisplay'),
    email: str('email'),
    whatsappNumber: str('whatsappNumber'),
    address: {
      street: str('street'),
      postalCode: str('postalCode'),
      city: str('city'),
      region: str('region'),
    },
    hours: {
      weekdayOpen: str('weekdayOpen'),
      weekdayClose: str('weekdayClose'),
      saturdayOpen: str('saturdayOpen'),
      saturdayClose: str('saturdayClose'),
    },
    geo: { lat: Number(formData.get('lat')), lng: Number(formData.get('lng')) },
    social: { facebook: str('facebook'), instagram: str('instagram'), google: str('google') },
  };

  const parsed = ContactInfoSchema.safeParse(candidate);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const db = getAdminFirestore();
  await db
    .doc('meta/contactInfo')
    .set({ ...parsed.data, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'contact-info',
    resourceId: 'contactInfo',
  });

  revalidateTag('contact-info');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Coordonnées mises à jour.' };
}
```

> `requireAdmin`, `writeAuditLog`, `getAdminFirestore`, `revalidateTag`,
> `revalidatePath`, `FormActionState` sont déjà importés dans ce fichier (action
> `toggleFeatureFlags`). Ne pas réimporter.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/contact-info-action.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests) ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/audit.ts "app/admin/(shell)/parametres/actions.ts" tests/unit/contact-info-action.test.ts
git commit -m "feat(contact): server action updateContactInfo + type audit contact-info"
```

---

### Task 7: Formulaire + 2e carte sur `/admin/parametres`

**Files:**

- Create: `components/admin/ContactInfoForm.tsx`
- Modify: `app/admin/(shell)/parametres/page.tsx`
- Test: `tests/unit/contact-info-form.test.tsx`

**Interfaces:**

- Consumes: `updateContactInfo` (Task 6), `ContactInfo`/`DEFAULT_CONTACT_INFO`/`normalizeContactInfo` (Task 1), `getAdminFirestore`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/contact-info-form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/admin/(shell)/parametres/actions', () => ({
  updateContactInfo: vi.fn(),
  toggleFeatureFlags: vi.fn(),
}));

import { ContactInfoForm } from '@/components/admin/ContactInfoForm';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';

describe('ContactInfoForm', () => {
  it('pré-remplit les champs avec les valeurs initiales', () => {
    render(<ContactInfoForm initial={{ ...DEFAULT_CONTACT_INFO, email: 'pre@rempli.gp' }} />);
    expect(screen.getByLabelText(/email/i)).toHaveValue('pre@rempli.gp');
    expect(screen.getByLabelText(/ville/i)).toHaveValue(DEFAULT_CONTACT_INFO.address.city);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/contact-info-form.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write minimal implementation**

Créer `components/admin/ContactInfoForm.tsx` :

```tsx
'use client';

import { useActionState } from 'react';
import { updateContactInfo } from '@/app/admin/(shell)/parametres/actions';
import type { ContactInfo } from '@/lib/contact-info';
import type { FormActionState } from '@/components/admin/FormShell';

const FIELDS: { name: string; label: string; value: (c: ContactInfo) => string; type?: string }[] =
  [
    { name: 'phone', label: 'Téléphone (E.164, +590…)', value: (c) => c.phone },
    { name: 'phoneDisplay', label: 'Téléphone affiché', value: (c) => c.phoneDisplay },
    { name: 'email', label: 'Email', value: (c) => c.email, type: 'email' },
    { name: 'whatsappNumber', label: 'WhatsApp (sans +)', value: (c) => c.whatsappNumber },
    { name: 'street', label: 'Rue', value: (c) => c.address.street },
    { name: 'postalCode', label: 'Code postal', value: (c) => c.address.postalCode },
    { name: 'city', label: 'Ville', value: (c) => c.address.city },
    { name: 'region', label: 'Région', value: (c) => c.address.region },
    { name: 'weekdayOpen', label: 'Ouverture semaine', value: (c) => c.hours.weekdayOpen },
    { name: 'weekdayClose', label: 'Fermeture semaine', value: (c) => c.hours.weekdayClose },
    { name: 'saturdayOpen', label: 'Ouverture samedi', value: (c) => c.hours.saturdayOpen },
    { name: 'saturdayClose', label: 'Fermeture samedi', value: (c) => c.hours.saturdayClose },
    { name: 'lat', label: 'GPS latitude', value: (c) => String(c.geo.lat) },
    { name: 'lng', label: 'GPS longitude', value: (c) => String(c.geo.lng) },
    { name: 'facebook', label: 'Facebook (URL)', value: (c) => c.social.facebook },
    { name: 'instagram', label: 'Instagram (URL)', value: (c) => c.social.instagram },
    { name: 'google', label: 'Google Business (URL)', value: (c) => c.social.google },
  ];

export function ContactInfoForm({ initial }: { initial: ContactInfo }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateContactInfo,
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      {FIELDS.map((f) => (
        <label
          key={f.name}
          className="flex flex-col gap-1 text-body-sm"
          style={{ color: 'var(--text)' }}
        >
          <span>{f.label}</span>
          <input
            name={f.name}
            type={f.type ?? 'text'}
            defaultValue={f.value(initial)}
            aria-label={f.label}
            className="rounded-[10px] px-3 py-2"
            style={{ border: '1px solid rgba(198, 198, 200, 0.6)' }}
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {state?.ok && (
        <p role="status" style={{ color: 'var(--green)' }}>
          {state.message}
        </p>
      )}
      {state && 'errors' in state && state.errors && (
        <p role="alert" style={{ color: 'var(--red)' }}>
          Vérifiez les champs (format tél/email/URL).
        </p>
      )}
    </form>
  );
}
```

Modifier `app/admin/(shell)/parametres/page.tsx` : lire les coordonnées et rendre la 2e carte. Ajouter aux imports :

```tsx
import { normalizeContactInfo } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';
import { ContactInfoForm } from '@/components/admin/ContactInfoForm';
```

Dans `ParametresPage`, après la lecture des flags, lire les coordonnées :

```tsx
const ciSnap = await getAdminFirestore().doc('meta/contactInfo').get();
const contactInfo: ContactInfo = normalizeContactInfo(
  ciSnap.exists ? (ciSnap.data() as Partial<ContactInfo>) : null
);
```

Et ajouter, après le bloc de la carte « Visibilité des sections » :

```tsx
      <div>
        <h2 className="font-title text-h3" style={{ color: 'var(--text)' }}>
          Coordonnées
        </h2>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Téléphone, email, WhatsApp, adresse, horaires, GPS et réseaux affichés sur le site.
        </p>
      </div>
      <ContactInfoForm initial={contactInfo} />
```

> `getAdminFirestore` est déjà importé dans la page (lecture des flags). Ne pas
> réimporter. La page est déjà `async` + `requireAdmin()`.

- [ ] **Step 4: Run test + build**

Run: `npx vitest run tests/unit/contact-info-form.test.tsx && npm run build`
Expected: test PASS ; build vert.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ContactInfoForm.tsx "app/admin/(shell)/parametres/page.tsx" tests/unit/contact-info-form.test.tsx
git commit -m "feat(contact): page BO Coordonnées (2e carte Paramètres) + formulaire"
```

---

### Task 8: Seed script + suite complète

**Files:**

- Create: `scripts/seed-contact-info.ts`

- [ ] **Step 1: Créer le script de seed (optionnel, pour poser les vraies valeurs)**

```ts
// scripts/seed-contact-info.ts
/**
 * Pose les coordonnées dans Firestore (meta/contactInfo).
 * Édite l'objet `contact` ci-dessous avec les vraies infos de Stéphane, puis :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance971 \
 *   npx tsx scripts/seed-contact-info.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!saPath || !projectId) {
  console.error('ERROR: set GOOGLE_APPLICATION_CREDENTIALS + NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  process.exit(1);
}

const contact = {
  phone: '+590690000000',
  phoneDisplay: '0690 00 00 00',
  email: 'contact@car-performance.gp',
  whatsappNumber: '590690000000',
  address: {
    street: 'Zone industrielle de Jarry',
    postalCode: '97122',
    city: 'Baie-Mahault',
    region: 'Guadeloupe',
  },
  hours: {
    weekdayOpen: '07:30',
    weekdayClose: '17:30',
    saturdayOpen: '08:00',
    saturdayClose: '13:00',
  },
  geo: { lat: 16.2415, lng: -61.5611 },
  social: { facebook: '', instagram: '', google: '' },
  updatedAt: Date.now(),
  updatedBy: 'seed-script',
};

initializeApp({ credential: cert(JSON.parse(readFileSync(resolve(saPath), 'utf-8'))), projectId });
getFirestore()
  .doc('meta/contactInfo')
  .set(contact, { merge: true })
  .then(() => {
    console.log('✓ meta/contactInfo posé');
    process.exit(0);
  })
  .catch((e) => {
    console.error('seed-contact-info failed:', e);
    process.exit(1);
  });
```

- [ ] **Step 2: Lancer la suite complète + build**

Run:

```bash
npx vitest run
npm run build
```

Expected: tous les unitaires verts (dont les 5 nouveaux fichiers contact-info), build vert.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-contact-info.ts
git commit -m "feat(contact): script de seed meta/contactInfo"
```

---

## Self-Review

**Spec coverage :**

- Data model `meta/contactInfo` (+ geo + social) → Task 1 (type/défauts) + Task 6 (écriture) + Task 8 (seed). ✓
- Helpers addressOneLine/whatsappUrl/openingHoursSpec/sameAs + Zod → Task 1. ✓
- `getCachedContactInfo` (tag) + adapter fail-open → Task 2. ✓
- Règle Firestore lecture publique → Task 3. ✓
- JSON-LD paramétré (geo + sameAs depuis ci) → Task 4. ✓
- Refactor consommateurs (layout + home + contact + 2 fiches) → Task 5. ✓
- Action `updateContactInfo` + audit → Task 6. ✓
- 2e carte BO + formulaire (tous les champs dont GPS/réseaux) → Task 7. ✓
- Tests unit/adapter/jsonld/action/form + build → réparties + Task 8. ✓

**Placeholder scan :** aucun TODO/TBD ; code complet partout (le `// …` dans les pages renvoie au code existant non modifié, pas à du code à inventer).

**Type consistency :** `ContactInfo` (mêmes champs partout), `getContactInfo`/`getCachedContactInfo`/`updateContactInfo`/`normalizeContactInfo`/`addressOneLine`/`whatsappUrl`/`openingHoursSpec`/`sameAs` stables ; `localBusinessJsonLd(ci)`/`organizationJsonLd(ci)` signatures alignées entre Task 4 (déf) et Task 5 (appel) ; `AuditResourceType` étendu (Task 6) avant usage.

## Ordre de dépendance

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. (4 dépend de 1 ; 5 de 2+4 ; 6 de 1 ; 7 de 6 ; 8 de tout.)
