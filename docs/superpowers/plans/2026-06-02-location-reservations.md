# Location — Réservations (sous-projet B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les réservations de `/location` réelles : persistance Firestore, emails (accusé client + notif Stéphane), et liste admin avec cycle de statut.

**Architecture:** Entité dédiée `Reservation`. Création **publique** façon checkout (`validateReservation` server action sur objet typé + recompute prix serveur + emails). Admin façon commandes (liste + transitions de statut via `requireAdmin` + audit). Lecture via `DataAdapter` (Static store + Firestore).

**Tech Stack:** Next.js 14 App Router, TypeScript, Zod, Firebase, Resend, Vitest.

Spec : `docs/superpowers/specs/2026-06-02-location-reservations-design.md`.

**Conventions :** prix en centimes ; PII (`permis`/contact) avec TTL RGPD `expiresAt` ; prix/total recalculés serveur.

---

### Task 1: Type `Reservation`

**Files:**

- Create: `lib/reservations.ts`

- [ ] **Step 1: Écrire le type**

```ts
// lib/reservations.ts
// Réservation de location. Prix en centimes. PII soumise à TTL RGPD (expiresAt).

export type ReservationStatus = 'nouvelle' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';

export type ReservationCustomer = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  permis: string;
};

export type Reservation = {
  id: string;
  reference: string;
  status: ReservationStatus;
  locationCarId: string;
  carLabel: string; // snapshot "Renault Clio V"
  dateDepart: string; // "YYYY-MM-DD"
  dateRetour: string; // "YYYY-MM-DD"
  nbJours: number;
  prixJourEnCents: number; // snapshot
  totalEnCents: number; // nbJours × prixJourEnCents (recalculé serveur)
  customer: ReservationCustomer;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  expiresAt: number; // unix ms — TTL Firestore (purge RGPD)
};
```

- [ ] **Step 2: Typecheck** — Run `npx tsc --noEmit` → exit 0.
- [ ] **Step 3: Commit** — `git add lib/reservations.ts && git commit -m "feat(reservations): type Reservation"`

---

### Task 2: Schéma Zod `reservation`

**Files:**

- Create: `lib/schemas/reservation.ts`
- Test: `tests/unit/schemas/reservation.test.ts`

- [ ] **Step 1: Test (RED)** — `tests/unit/schemas/reservation.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { parseReservation, reservationSchema } from '@/lib/schemas/reservation';

const valid = {
  id: 'r1',
  reference: 'LOC-ABC-1234',
  status: 'nouvelle',
  locationCarId: 'clio-v',
  carLabel: 'Renault Clio V',
  dateDepart: '2026-07-01',
  dateRetour: '2026-07-05',
  nbJours: 4,
  prixJourEnCents: 4500,
  totalEnCents: 18000,
  customer: {
    prenom: 'Marie',
    nom: 'Dupont',
    email: 'marie@example.com',
    telephone: '0690123456',
    permis: '123456789',
  },
  createdAt: '2026-06-02T00:00:00.000Z',
  updatedAt: '2026-06-02T00:00:00.000Z',
  expiresAt: 1800000000000,
};

describe('reservationSchema', () => {
  it('parse une réservation valide', () => {
    expect(() => reservationSchema.parse(valid)).not.toThrow();
  });

  it('rejette un statut inconnu', () => {
    expect(() => reservationSchema.parse({ ...valid, status: 'wip' })).toThrow();
  });

  it('accepte les 5 statuts', () => {
    for (const status of ['nouvelle', 'confirmee', 'en_cours', 'terminee', 'annulee']) {
      expect(() => reservationSchema.parse({ ...valid, status })).not.toThrow();
    }
  });

  it('rejette nbJours < 1', () => {
    expect(() => reservationSchema.parse({ ...valid, nbJours: 0 })).toThrow();
  });

  it('rejette un total non entier', () => {
    expect(() => reservationSchema.parse({ ...valid, totalEnCents: 1.5 })).toThrow();
  });

  it('rejette un email client invalide', () => {
    expect(() =>
      reservationSchema.parse({ ...valid, customer: { ...valid.customer, email: 'nope' } })
    ).toThrow();
  });

  it('parseReservation strip les champs inconnus', () => {
    const r = parseReservation({ ...valid, deletedAt: null });
    expect(r.reference).toBe('LOC-ABC-1234');
    expect('deletedAt' in r).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run tests/unit/schemas/reservation.test.ts` (module manquant).

- [ ] **Step 3: Schéma (GREEN)** — `lib/schemas/reservation.ts`

```ts
import { z } from 'zod';
import type { Reservation } from '@/lib/reservations';

const customerSchema = z.object({
  prenom: z.string().min(1).max(50),
  nom: z.string().min(1).max(50),
  email: z.string().email().max(100),
  telephone: z.string().min(8).max(20),
  permis: z.string().min(1).max(40),
});

export const reservationSchema = z.object({
  id: z.string().min(1),
  reference: z.string().min(1),
  status: z.enum(['nouvelle', 'confirmee', 'en_cours', 'terminee', 'annulee']),
  locationCarId: z.string().min(1),
  carLabel: z.string().min(1),
  dateDepart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateRetour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nbJours: z.number().int().min(1),
  prixJourEnCents: z.number().int().nonnegative(),
  totalEnCents: z.number().int().nonnegative(),
  customer: customerSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.number(),
});

export function parseReservation(data: unknown): Reservation {
  return reservationSchema.parse(data);
}
```

- [ ] **Step 4: Run → PASS** — `npx vitest run tests/unit/schemas/reservation.test.ts` (7 tests) + `npx tsc --noEmit` exit 0.
- [ ] **Step 5: Commit** — `git add lib/schemas/reservation.ts tests/unit/schemas/reservation.test.ts && git commit -m "feat(reservations): schéma Zod + tests"`

---

### Task 3: Adapter (create/get/getById/updateStatus) + audit union

**Files:**

- Modify: `lib/data/types.ts`, `lib/data/static.ts`, `lib/data/firebase.ts`, `lib/admin/audit.ts`
- Test: `tests/unit/data-adapter.test.ts`

- [ ] **Step 1: Test (RED)** — ajouter à la fin de `tests/unit/data-adapter.test.ts` (réutiliser l'import `StaticAdapter` déjà présent en haut du fichier — NE PAS le dupliquer) :

```ts
describe('StaticAdapter — reservations', () => {
  const baseRes = {
    reference: 'LOC-X-1',
    status: 'nouvelle' as const,
    locationCarId: 'clio-v',
    carLabel: 'Renault Clio V',
    dateDepart: '2026-07-01',
    dateRetour: '2026-07-03',
    nbJours: 2,
    prixJourEnCents: 4500,
    totalEnCents: 9000,
    customer: { prenom: 'A', nom: 'B', email: 'a@b.fr', telephone: '0690000000', permis: 'X1' },
    createdAt: '2026-06-02T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
    expiresAt: 1800000000000,
  };

  it('createReservation puis getReservationById', async () => {
    const adapter = new StaticAdapter();
    const id = await adapter.createReservation(baseRes);
    const got = await adapter.getReservationById(id);
    expect(got?.reference).toBe('LOC-X-1');
    expect(got?.status).toBe('nouvelle');
  });

  it('updateReservationStatus mute le statut', async () => {
    const adapter = new StaticAdapter();
    const id = await adapter.createReservation(baseRes);
    await adapter.updateReservationStatus(id, 'confirmee');
    const got = await adapter.getReservationById(id);
    expect(got?.status).toBe('confirmee');
  });

  it('getReservations filtre par statut', async () => {
    const adapter = new StaticAdapter();
    await adapter.createReservation(baseRes);
    await adapter.createReservation({ ...baseRes, status: 'annulee' });
    const annulees = await adapter.getReservations({ status: 'annulee' });
    expect(annulees.every((r) => r.status === 'annulee')).toBe(true);
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run tests/unit/data-adapter.test.ts`.

- [ ] **Step 3: Interface** — `lib/data/types.ts`
      Ajouter `import type { Reservation, ReservationStatus } from '@/lib/reservations';` (près des autres type imports). Dans `DataAdapter`, après les méthodes location-cars :

```ts
  createReservation(data: Omit<Reservation, 'id'>): Promise<string>;
  getReservations(filters?: { status?: ReservationStatus; limit?: number }): Promise<Reservation[]>;
  getReservationById(id: string): Promise<Reservation | null>;
  updateReservationStatus(id: string, status: ReservationStatus): Promise<void>;
```

- [ ] **Step 4: StaticAdapter** — `lib/data/static.ts`
      Ajouter imports `import type { Reservation, ReservationStatus } from '@/lib/reservations';`.
      Ajouter un store module-level près de `ORDERS_STORE` (chercher comment `ORDERS_STORE` + `orderIdCounter` sont déclarés et mirror) :

```ts
const RESERVATIONS_STORE: Reservation[] = [];
let reservationIdCounter = 1;
```

Ajouter les méthodes (après les méthodes location-cars) :

```ts
  async createReservation(data: Omit<Reservation, 'id'>): Promise<string> {
    const id = `static-reservation-${reservationIdCounter++}`;
    RESERVATIONS_STORE.push({ ...data, id });
    return id;
  }

  async getReservations(filters?: {
    status?: ReservationStatus;
    limit?: number;
  }): Promise<Reservation[]> {
    let res = [...RESERVATIONS_STORE].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filters?.status) res = res.filter((r) => r.status === filters.status);
    if (filters?.limit) res = res.slice(0, filters.limit);
    return res;
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    return RESERVATIONS_STORE.find((r) => r.id === id) ?? null;
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
    const r = RESERVATIONS_STORE.find((x) => x.id === id);
    if (r) {
      r.status = status;
      r.updatedAt = new Date().toISOString();
    }
  }
```

- [ ] **Step 5: FirebaseAdapter** — `lib/data/firebase.ts`
      Ajouter imports `import { parseReservation } from '@/lib/schemas/reservation';` et `import type { Reservation, ReservationStatus } from '@/lib/reservations';`.
      Ajouter ref près des autres : `private readonly reservationsRef = collection(db, 'reservations');`
      Ajouter les méthodes (après les méthodes location-cars). NB : `addDoc`, `orderBy`, `firestoreLimit`, `updateDoc`, `serverTimestamp` sont déjà importés (utilisés par createOrder/getOrders) :

```ts
  async createReservation(data: Omit<Reservation, 'id'>): Promise<string> {
    const docRef = await addDoc(this.reservationsRef, data);
    return docRef.id;
  }

  async getReservations(filters?: {
    status?: ReservationStatus;
    limit?: number;
  }): Promise<Reservation[]> {
    let q = query(this.reservationsRef, orderBy('createdAt', 'desc'));
    if (filters?.status) {
      q = query(this.reservationsRef, where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }
    if (filters?.limit) q = query(q, firestoreLimit(filters.limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => parseReservation({ ...d.data(), id: d.id }));
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    const docRef = doc(db, 'reservations', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return parseReservation({ ...snap.data(), id: snap.id });
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
    const docRef = doc(db, 'reservations', id);
    await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
  }
```

Si `firestoreLimit` n'est pas le nom importé (vérifier l'import `limit as firestoreLimit` en haut de firebase.ts via `grep -n "limit" lib/data/firebase.ts`), utiliser le nom réel.

- [ ] **Step 6: Mocks** — `tests/unit/data-adapter.test.ts`
      Pour chaque mock `DataAdapter` (ceux avec `getLocationCars: async () => ...`), ajouter :

```ts
      createReservation: async () => 'res-mock',
      getReservations: async () => [],
      getReservationById: async () => null,
      updateReservationStatus: async () => {},
```

- [ ] **Step 7: Audit union** — `lib/admin/audit.ts`
      Ajouter `'reservation'` au type union `AuditResourceType` (qui contient déjà `'location-car'`).

- [ ] **Step 8: Run → PASS** — `npx vitest run tests/unit/data-adapter.test.ts && npx tsc --noEmit` (tests verts, tsc 0).
- [ ] **Step 9: Commit** — `git add lib/data/types.ts lib/data/static.ts lib/data/firebase.ts lib/admin/audit.ts tests/unit/data-adapter.test.ts && git commit -m "feat(reservations): adapter create/get/getById/updateStatus + audit union"`

---

### Task 4: Emails réservation

**Files:**

- Create: `lib/emails/reservationConfirmation.ts`, `lib/emails/reservationNotification.ts`
- Modify: `lib/emails/send.ts`
- Test: `tests/unit/emails/reservation.test.ts`

- [ ] **Step 1: Test (RED)** — `tests/unit/emails/reservation.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { buildReservationConfirmationEmail } from '@/lib/emails/reservationConfirmation';
import { buildReservationNotificationEmail } from '@/lib/emails/reservationNotification';
import type { Reservation } from '@/lib/reservations';

const res: Reservation = {
  id: 'r1',
  reference: 'LOC-ABC-1234',
  status: 'nouvelle',
  locationCarId: 'clio-v',
  carLabel: 'Renault Clio V',
  dateDepart: '2026-07-01',
  dateRetour: '2026-07-05',
  nbJours: 4,
  prixJourEnCents: 4500,
  totalEnCents: 18000,
  customer: {
    prenom: 'Marie',
    nom: 'Dupont',
    email: 'marie@example.com',
    telephone: '0690123456',
    permis: '123456789',
  },
  createdAt: '2026-06-02T00:00:00.000Z',
  updatedAt: '2026-06-02T00:00:00.000Z',
  expiresAt: 1800000000000,
};

describe('emails réservation', () => {
  it('confirmation client : sujet avec référence + voiture dans le corps', () => {
    const { subject, html } = buildReservationConfirmationEmail(res);
    expect(subject).toContain('LOC-ABC-1234');
    expect(html).toContain('Renault Clio V');
    expect(html).toContain('180,00'); // total formaté
  });

  it('notification gérant : contient coordonnées + permis + dates', () => {
    const { subject, html } = buildReservationNotificationEmail(res);
    expect(subject).toContain('LOC-ABC-1234');
    expect(html).toContain('marie@example.com');
    expect(html).toContain('0690123456');
    expect(html).toContain('2026-07-01');
  });

  it('échappe le HTML des champs client', () => {
    const xss = { ...res, customer: { ...res.customer, nom: '<script>x</script>' } };
    const { html } = buildReservationNotificationEmail(xss);
    expect(html).not.toContain('<script>x</script>');
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run tests/unit/emails/reservation.test.ts`.

- [ ] **Step 3: Templates (GREEN)** — `lib/emails/reservationConfirmation.ts`

```ts
import { formatPrice } from '@/lib/utils';
import type { Reservation } from '@/lib/reservations';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildReservationConfirmationEmail(r: Reservation): {
  subject: string;
  html: string;
} {
  const subject = `Demande de réservation reçue — ${escapeHtml(r.reference)}`;
  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#1A0F06;">
  <h2>Merci ${escapeHtml(r.customer.prenom)} !</h2>
  <p>Votre demande de réservation pour la <strong>${escapeHtml(r.carLabel)}</strong> a bien été reçue.
  Nous vous recontactons rapidement pour la confirmer.</p>
  <table style="width:100%;max-width:480px;border-collapse:collapse;margin-top:12px;">
    <tr><td>Référence</td><td style="text-align:right;font-weight:600;">${escapeHtml(r.reference)}</td></tr>
    <tr><td>Du</td><td style="text-align:right;">${escapeHtml(r.dateDepart)}</td></tr>
    <tr><td>Au</td><td style="text-align:right;">${escapeHtml(r.dateRetour)}</td></tr>
    <tr><td>Durée</td><td style="text-align:right;">${r.nbJours} jour(s)</td></tr>
    <tr><td>Total estimé</td><td style="text-align:right;font-weight:700;">${formatPrice(r.totalEnCents)}</td></tr>
  </table>
  <p style="font-size:12px;color:#999;margin-top:16px;">Car Performance Guadeloupe — cette estimation ne vaut pas confirmation.</p>
</body></html>`;
  return { subject, html };
}
```

`lib/emails/reservationNotification.ts` :

```ts
import { formatPrice } from '@/lib/utils';
import type { Reservation } from '@/lib/reservations';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildReservationNotificationEmail(r: Reservation): {
  subject: string;
  html: string;
} {
  const c = r.customer;
  const subject = `Nouvelle réservation à traiter — ${escapeHtml(r.reference)}`;
  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#1A0F06;">
  <h2>Réservation ${escapeHtml(r.carLabel)}</h2>
  <table style="width:100%;max-width:520px;border-collapse:collapse;">
    <tr><td>Référence</td><td style="text-align:right;font-weight:600;">${escapeHtml(r.reference)}</td></tr>
    <tr><td>Période</td><td style="text-align:right;">${escapeHtml(r.dateDepart)} → ${escapeHtml(r.dateRetour)} (${r.nbJours}j)</td></tr>
    <tr><td>Total estimé</td><td style="text-align:right;font-weight:700;">${formatPrice(r.totalEnCents)}</td></tr>
  </table>
  <h3>Client</h3>
  <p>
    ${escapeHtml(c.prenom)} ${escapeHtml(c.nom)}<br/>
    Email : ${escapeHtml(c.email)}<br/>
    Tél : ${escapeHtml(c.telephone)}<br/>
    Permis : ${escapeHtml(c.permis)}
  </p>
</body></html>`;
  return { subject, html };
}
```

- [ ] **Step 4: `sendReservationEmails`** — ajouter à `lib/emails/send.ts` (lire le fichier d'abord ; il exporte déjà `sendOrderEmails` et importe `getResend`, `EMAIL_FROM`, `EMAIL_ADMIN`). Ajouter en bas :

```ts
import { buildReservationConfirmationEmail } from '@/lib/emails/reservationConfirmation';
import { buildReservationNotificationEmail } from '@/lib/emails/reservationNotification';
import type { Reservation } from '@/lib/reservations';

/**
 * Emails de réservation (fire-and-forget) : accusé client + notif gérant.
 * Silencieux si RESEND_API_KEY absente.
 */
export function sendReservationEmails(reservation: Reservation): void {
  if (!process.env.RESEND_API_KEY) return;

  const confirmation = buildReservationConfirmationEmail(reservation);
  getResend()
    .emails.send({
      from: EMAIL_FROM,
      to: reservation.customer.email,
      subject: confirmation.subject,
      html: confirmation.html,
    })
    .catch((err) => console.error('[emails] Accusé réservation client échoué:', err));

  if (EMAIL_ADMIN) {
    const notification = buildReservationNotificationEmail(reservation);
    getResend()
      .emails.send({
        from: EMAIL_FROM,
        to: EMAIL_ADMIN,
        subject: notification.subject,
        html: notification.html,
      })
      .catch((err) => console.error('[emails] Notif réservation gérant échouée:', err));
  }
}
```

(Si `send.ts` met tous les imports en tête de fichier, déplacer les 3 `import` ci-dessus en haut plutôt qu'au-dessus de la fonction — respecter le style du fichier.)

- [ ] **Step 5: Run → PASS** — `npx vitest run tests/unit/emails/reservation.test.ts && npx tsc --noEmit`.
- [ ] **Step 6: Commit** — `git add lib/emails/ tests/unit/emails/reservation.test.ts && git commit -m "feat(reservations): emails accusé client + notif gérant"`

---

### Task 5: Création publique `validateReservation` + référence

**Files:**

- Modify: `lib/utils.ts` (ajouter `generateReservationReference`)
- Create: `app/location/actions.ts`
- Test: `tests/unit/reservation-action.test.ts`

- [ ] **Step 1: Référence** — `lib/utils.ts`, après `generateOrderNumber` :

```ts
export function generateReservationReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOC-${timestamp}-${random}`;
}
```

- [ ] **Step 2: Test (RED)** — `tests/unit/reservation-action.test.ts`
      Le StaticAdapter par défaut sert le seed `LOCATION_CARS` (dont `clio-v` est `disponible:true` et `renault-trafic` est `disponible:false`). On mocke les emails.

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/emails/send', () => ({ sendReservationEmails: vi.fn() }));

import { validateReservation } from '../../app/location/actions';

const base = {
  locationCarId: 'clio-v',
  dateDepart: '2099-07-01',
  dateRetour: '2099-07-05',
  prenom: 'Marie',
  nom: 'Dupont',
  email: 'marie@example.com',
  telephone: '0690123456',
  permis: '123456789',
  consent: true,
};

describe('validateReservation', () => {
  it('succès : recompute nbJours + total, renvoie une référence LOC-', async () => {
    const res = await validateReservation(base);
    expect(res.success).toBe(true);
    expect(res.reference).toMatch(/^LOC-/);
  });

  it('rejette si dateRetour <= dateDepart', async () => {
    const res = await validateReservation({ ...base, dateRetour: '2099-07-01' });
    expect(res.success).toBe(false);
    expect(res.errors.dateRetour).toBeDefined();
  });

  it('rejette une date de départ passée', async () => {
    const res = await validateReservation({
      ...base,
      dateDepart: '2000-01-01',
      dateRetour: '2000-01-05',
    });
    expect(res.success).toBe(false);
    expect(res.errors.dateDepart).toBeDefined();
  });

  it('rejette une voiture introuvable', async () => {
    const res = await validateReservation({ ...base, locationCarId: 'inconnu' });
    expect(res.success).toBe(false);
    expect(res.errors._form).toBeDefined();
  });

  it('rejette une voiture indisponible', async () => {
    const res = await validateReservation({ ...base, locationCarId: 'renault-trafic' });
    expect(res.success).toBe(false);
    expect(res.errors._form).toBeDefined();
  });

  it('rejette sans consentement', async () => {
    const res = await validateReservation({ ...base, consent: false });
    expect(res.success).toBe(false);
    expect(res.errors.consent).toBeDefined();
  });

  it('rejette un email invalide', async () => {
    const res = await validateReservation({ ...base, email: 'nope' });
    expect(res.success).toBe(false);
    expect(res.errors.email).toBeDefined();
  });
});
```

- [ ] **Step 3: Run → FAIL** — `npx vitest run tests/unit/reservation-action.test.ts`.

- [ ] **Step 4: Action (GREEN)** — `app/location/actions.ts`

```ts
'use server';

import { generateReservationReference } from '@/lib/utils';
import { getAdapter } from '@/lib/data';
import { sendReservationEmails } from '@/lib/emails/send';
import type { Reservation } from '@/lib/reservations';

export interface ReservationValidationResult {
  success: boolean;
  errors: Record<string, string>;
  reference?: string;
}

const FIELD_LIMITS = { prenom: 50, nom: 50, email: 100, telephone: 20, permis: 40 } as const;
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 mois (RGPD)
const DAY_MS = 24 * 60 * 60 * 1000;

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export async function validateReservation(input: {
  locationCarId: string;
  dateDepart: string;
  dateRetour: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  permis: string;
  consent: boolean;
}): Promise<ReservationValidationResult> {
  const errors: Record<string, string> = {};

  const prenom = sanitize(input.prenom);
  const nom = sanitize(input.nom);
  const email = sanitize(input.email);
  const telephone = sanitize(input.telephone);
  const permis = sanitize(input.permis);
  const locationCarId = sanitize(input.locationCarId);
  const dateDepart = sanitize(input.dateDepart);
  const dateRetour = sanitize(input.dateRetour);

  if (!prenom || prenom.length > FIELD_LIMITS.prenom) errors.prenom = 'Prénom requis';
  if (!nom || nom.length > FIELD_LIMITS.nom) errors.nom = 'Nom requis';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.length > FIELD_LIMITS.email || !emailRe.test(email) || /[<>"']/.test(email)) {
    errors.email = 'Email invalide';
  }
  if (!/^[0-9+\s().-]{8,20}$/.test(telephone)) errors.telephone = 'Téléphone invalide';
  if (!permis || permis.length > FIELD_LIMITS.permis) errors.permis = 'Numéro de permis requis';

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const depMs = Date.parse(dateDepart);
  const retMs = Date.parse(dateRetour);
  if (!dateRe.test(dateDepart) || Number.isNaN(depMs)) {
    errors.dateDepart = 'Date de départ invalide';
  } else if (depMs < Date.now() - DAY_MS) {
    errors.dateDepart = 'La date de départ est passée';
  }
  if (!dateRe.test(dateRetour) || Number.isNaN(retMs)) {
    errors.dateRetour = 'Date de retour invalide';
  } else if (!Number.isNaN(depMs) && retMs <= depMs) {
    errors.dateRetour = 'Le retour doit être après le départ';
  }

  if (input.consent !== true) errors.consent = 'Consentement requis';

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const adapter = await getAdapter();
  const car = await adapter.getLocationCarById(locationCarId);
  if (!car) return { success: false, errors: { _form: 'Voiture introuvable.' } };
  if (!car.disponible) return { success: false, errors: { _form: 'Voiture indisponible.' } };

  const nbJours = Math.max(1, Math.ceil((retMs - depMs) / DAY_MS));
  const totalEnCents = nbJours * car.prixJourEnCents;
  const now = new Date().toISOString();
  const reference = generateReservationReference();

  const data: Omit<Reservation, 'id'> = {
    reference,
    status: 'nouvelle',
    locationCarId: car.id,
    carLabel: `${car.marque} ${car.modele}`,
    dateDepart,
    dateRetour,
    nbJours,
    prixJourEnCents: car.prixJourEnCents,
    totalEnCents,
    customer: { prenom, nom, email, telephone, permis },
    createdAt: now,
    updatedAt: now,
    expiresAt: Date.now() + TTL_MS,
  };

  const id = await adapter.createReservation(data);
  sendReservationEmails({ ...data, id });

  return { success: true, errors: {}, reference };
}
```

- [ ] **Step 5: Run → PASS** — `npx vitest run tests/unit/reservation-action.test.ts && npx tsc --noEmit` (7 tests verts).
- [ ] **Step 6: Commit** — `git add lib/utils.ts app/location/actions.ts tests/unit/reservation-action.test.ts && git commit -m "feat(reservations): validateReservation (recompute serveur + persist + emails)"`

---

### Task 6: Admin — `updateReservationStatus` (transitions gardées)

**Files:**

- Create: `app/admin/reservations/actions.ts`
- Test: `tests/unit/admin-reservations-actions.test.ts`

- [ ] **Step 1: Test (RED)** — `tests/unit/admin-reservations-actions.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireAdminMock, writeAuditLogMock, revalidatePathMock, updateStatusMock, getByIdMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    writeAuditLogMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    updateStatusMock: vi.fn(),
    getByIdMock: vi.fn(),
  }));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: requireAdminMock,
  AdminError: class AdminError extends Error {},
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: writeAuditLogMock }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));
vi.mock('@/lib/data', () => ({
  getAdapter: vi.fn(async () => ({
    getReservationById: getByIdMock,
    updateReservationStatus: updateStatusMock,
  })),
}));

import { updateReservationStatus } from '@/app/admin/reservations/actions';

describe('updateReservationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@gp.fr' });
  });

  it('transition autorisée nouvelle→confirmee : update + audit', async () => {
    getByIdMock.mockResolvedValue({ id: 'r1', status: 'nouvelle' });
    const res = await updateReservationStatus('r1', 'confirmee');
    expect(updateStatusMock).toHaveBeenCalledWith('r1', 'confirmee');
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'reservation', resourceId: 'r1' })
    );
    expect(res).toMatchObject({ ok: true });
  });

  it('transition interdite nouvelle→terminee : rejet sans update', async () => {
    getByIdMock.mockResolvedValue({ id: 'r1', status: 'nouvelle' });
    const res = await updateReservationStatus('r1', 'terminee');
    expect(updateStatusMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('réservation introuvable : rejet', async () => {
    getByIdMock.mockResolvedValue(null);
    const res = await updateReservationStatus('rX', 'confirmee');
    expect(updateStatusMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('non-admin : AdminError propagée', async () => {
    requireAdminMock.mockRejectedValue(Object.assign(new Error('refusé'), { status: 403 }));
    await expect(updateReservationStatus('r1', 'confirmee')).rejects.toMatchObject({ status: 403 });
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run tests/unit/admin-reservations-actions.test.ts`.

- [ ] **Step 3: Action (GREEN)** — `app/admin/reservations/actions.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdapter } from '@/lib/data';
import type { ReservationStatus } from '@/lib/reservations';

import type { FormActionState } from '@/components/admin/FormShell';

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee'],
  terminee: [],
  annulee: [],
};

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<FormActionState> {
  const session = await requireAdmin();

  const adapter = await getAdapter();
  const current = await adapter.getReservationById(id);
  if (!current) {
    return { errors: { _form: ['Réservation introuvable.'] } };
  }
  if (!TRANSITIONS[current.status].includes(status)) {
    return { errors: { _form: [`Transition ${current.status} → ${status} non autorisée.`] } };
  }

  await adapter.updateReservationStatus(id, status);

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'reservation',
    resourceId: id,
  });

  revalidatePath('/admin/reservations');
  return { ok: true, message: 'Statut mis à jour.' };
}
```

- [ ] **Step 4: Run → PASS** — `npx vitest run tests/unit/admin-reservations-actions.test.ts && npx tsc --noEmit` (4 tests).
- [ ] **Step 5: Commit** — `git add app/admin/reservations/actions.ts tests/unit/admin-reservations-actions.test.ts && git commit -m "feat(reservations): admin updateReservationStatus + transitions gardées"`

---

### Task 7: Admin — liste `ReservationsClient` + route + sidebar

**Files:**

- Create: `app/admin/(shell)/reservations/page.tsx`, `app/admin/(shell)/reservations/ReservationsClient.tsx`
- Modify: `components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Client** — `app/admin/(shell)/reservations/ReservationsClient.tsx`
      Composant liste (patron `OrdersClient` mais plus simple — pas de fetch, données en props ; statut muté via la server action). Lire `app/admin/(shell)/commandes/OrdersClient.tsx` pour les conventions de style (couleurs `IOS`, badges).

```tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { formatPrice } from '@/lib/utils';
import { updateReservationStatus } from '@/app/admin/reservations/actions';
import type { Reservation, ReservationStatus } from '@/lib/reservations';

const STATUS_LABEL: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  nouvelle: { label: 'Nouvelle', color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
  confirmee: { label: 'Confirmée', color: '#007AFF', bg: 'rgba(0,122,255,0.08)' },
  en_cours: { label: 'En cours', color: '#FF6B2C', bg: 'rgba(255,107,44,0.1)' },
  terminee: { label: 'Terminée', color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  annulee: { label: 'Annulée', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
};

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee'],
  terminee: [],
  annulee: [],
};

function Row({ reservation }: { reservation: Reservation }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ReservationStatus>(reservation.status);
  const [busy, setBusy] = useState(false);
  const cfg = STATUS_LABEL[status];

  const change = async (next: ReservationStatus) => {
    setBusy(true);
    const res = await updateReservationStatus(reservation.id, next);
    setBusy(false);
    if (res.ok) {
      setStatus(next);
      showToast({ type: 'success', message: `Statut : ${STATUS_LABEL[next].label}` });
    } else {
      showToast({ type: 'error', message: res.errors?._form?.[0] ?? 'Erreur' });
    }
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(198,198,200,0.5)' }} className="px-5 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="font-mono text-sm font-semibold" style={{ color: '#1C1C1E' }}>
            {reservation.reference}
          </span>
          <span
            className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.label}
          </span>
          <p className="text-sm mt-1" style={{ color: 'rgba(28,28,30,0.6)' }}>
            {reservation.carLabel} · {reservation.dateDepart} → {reservation.dateRetour} (
            {reservation.nbJours}j) · {formatPrice(reservation.totalEnCents)}
          </p>
          <p className="text-sm" style={{ color: 'rgba(28,28,30,0.6)' }}>
            {reservation.customer.prenom} {reservation.customer.nom} · {reservation.customer.email}{' '}
            · {reservation.customer.telephone} · permis {reservation.customer.permis}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {TRANSITIONS[status].map((next) => (
            <button
              key={next}
              type="button"
              disabled={busy}
              onClick={() => change(next)}
              className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{
                background: next === 'annulee' ? 'rgba(255,59,48,0.1)' : 'rgba(0,122,255,0.1)',
                color: next === 'annulee' ? '#FF3B30' : '#007AFF',
              }}
            >
              → {STATUS_LABEL[next].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReservationsClient({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) {
    return (
      <p className="px-5 py-16 text-center" style={{ color: 'rgba(28,28,30,0.6)' }}>
        Aucune réservation pour le moment.
      </p>
    );
  }
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid rgba(198,198,200,0.5)' }}
    >
      {reservations.map((r) => (
        <Row key={r.id} reservation={r} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Page** — `app/admin/(shell)/reservations/page.tsx`

```tsx
import { getAdapter } from '@/lib/data';

import { ReservationsClient } from './ReservationsClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réservations — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminReservationsPage() {
  const adapter = await getAdapter();
  const reservations = await adapter.getReservations({ limit: 100 });

  return (
    <div className="p-4">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Réservations</h1>
      <ReservationsClient reservations={reservations} />
    </div>
  );
}
```

- [ ] **Step 3: Sidebar** — `components/admin/AdminSidebar.tsx`
      Ajouter `CalendarCheck` à l'import lucide-react. Dans la section `title: 'Activité'`, après l'item Commandes :

```ts
      { href: '/admin/reservations', label: 'Réservations', icon: CalendarCheck, enabled: true },
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run build` (exit 0 ; route `/admin/reservations` listée).
- [ ] **Step 5: Commit** — `git add "app/admin/(shell)/reservations" components/admin/AdminSidebar.tsx && git commit -m "feat(reservations): admin liste + transitions + sidebar"`

---

### Task 8: Câblage formulaire storefront

**Files:**

- Modify: `app/location/LocationClient.tsx`

- [ ] **Step 1: Lire `app/location/LocationClient.tsx`** — repérer : le `type ReservationData` (champs `vehiculeId, dateDepart, dateRetour, prenom, nom, email, tel, permis, consent`), la fonction `generateRef()`, et le handler de l'étape finale (step 2) qui fait `setRef(generateRef()); setDone(true);`.

- [ ] **Step 2: Importer l'action** — en tête :

```ts
import { validateReservation } from './actions';
```

- [ ] **Step 3: Remplacer la soumission finale**
      Le composant a un handler `next()` (ou équivalent) qui à `step === 2` fait `setRef(generateRef()); setDone(true);`. Rendre ce point d'entrée async et appeler l'action. Remplacer le bloc :

```ts
if (step === 2) {
  setRef(generateRef());
  setDone(true);
  return;
}
```

par :

```ts
if (step === 2) {
  const result = await validateReservation({
    locationCarId: formData.vehiculeId,
    dateDepart: formData.dateDepart,
    dateRetour: formData.dateRetour,
    prenom: formData.prenom,
    nom: formData.nom,
    email: formData.email,
    telephone: formData.tel,
    permis: formData.permis,
    consent: formData.consent,
  });
  if (!result.success) {
    setErrors(result.errors as Partial<Record<keyof ReservationData, string>>);
    return;
  }
  setRef(result.reference!);
  setDone(true);
  return;
}
```

Rendre la fonction conteneur `async` si elle ne l'est pas déjà (et le `onClick` qui l'appelle peut rester tel quel — un handler async non-awaité est OK ici). Si `setErrors` n'existe pas sous ce nom, utiliser le setter d'erreurs réellement présent (repéré au Step 1).

- [ ] **Step 4: Supprimer `generateRef`** — retirer la fonction `generateRef()` (devenue morte) et son usage. Si elle est encore référencée ailleurs, ne pas la supprimer ; sinon la retirer.

- [ ] **Step 5: Verify** — `npx tsc --noEmit && npm run build` (exit 0 ; `/location` build).
- [ ] **Step 6: Commit** — `git add app/location/LocationClient.tsx && git commit -m "feat(reservations): câblage formulaire /location sur validateReservation (fin du factice)"`

---

### Task 9: Gate CI + review finale + PR

**Files:** aucun.

- [ ] **Step 1: Suite unit** — `npx vitest run` → tous verts (433 + ~25 nouveaux).
- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0.
- [ ] **Step 3: Lint** — `npm run lint` → 0 nouveau (warning pré-existant `product.ts` toléré).
- [ ] **Step 4: Format** — `npx prettier --check "**/*.{ts,tsx,json,css,md}" --ignore-path .prettierignore` ; si fichiers trackés flaggés → `prettier --write` + recommit.
- [ ] **Step 5: Build** — `npm run build` → OK, routes `/admin/reservations` + `/location`.
- [ ] **Step 6: Push + PR**

```bash
git push -u origin feat/location-reservations
gh pr create --base main --title "feat(location): réservations (sous-projet B)" --body "Voir docs/superpowers/specs/2026-06-02-location-reservations-design.md"
```

Attendre CI verte avant merge.

---

## Notes d'exécution

- `validateReservation` prend un **objet typé** (pas FormData), comme `validateCheckout`.
- `updateReservationStatus` est une **server action** appelée depuis `ReservationsClient` (client component) — pas d'API route.
- Transitions gardées **serveur** (Task 6) ET reflétées dans l'UI (Task 7) — garder les deux `TRANSITIONS` synchronisés.
- Pas d'email auto sur transition (v1). Pas de contrôle de disponibilité par dates (→ C).
- E2E différé (multi-step + dates).
