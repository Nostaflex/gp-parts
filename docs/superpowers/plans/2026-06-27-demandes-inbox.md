# Boîte de réception des demandes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persister chaque soumission des formulaires contact + RDV réparation dans Firestore (`demandes`) et la rendre consultable/gérable depuis `/admin/demandes` (liste, filtres, statuts, notes), sans plus jamais perdre de lead.

**Architecture:** Réutilise le type `Demande` existant + le pattern réservations (`createReservation` / `reservations-server` / règle `create` publique / admin client). Les actions persistent **d'abord** (client SDK, règle `create` publique) puis notifient par email en best-effort. Le BO lit/gère via Admin SDK.

**Tech Stack:** Next.js 14.2 App Router, React 18, TypeScript 5.4, Firestore (client SDK create / Admin SDK read+update), Vitest + happy-dom + RTL, Playwright.

## Global Constraints

- `DemandeType` = `'contact' | 'vehicule' | 'moto' | 'piece' | 'financement' | 'reparation'`. `DemandeStatus` = `'nouvelle' | 'en_cours' | 'traitee' | 'deleted'`.
- Persist **avant** email ; email best-effort (échec email ⇒ `ok` quand même si le lead est sauvé).
- Création publique via client SDK + règle `demandes allow create` ; lecture/gestion via Admin SDK + `requireAdmin`.
- `expiresAt = Date.now() + 13 mois` (TTL RGPD). Soft-delete only (`status: 'deleted'`).
- Détails RDV aplatis dans `message` (schéma `Demande` inchangé).
- Locale FR ; design iOS Clarity au BO ; imports React → Next → lib → components → types.
- TDD strict ; `--no-verify` interdit au commit final (hook prettier doit passer).

---

### Task 1: `DemandeType` +reparation + `createDemande` (adapter)

**Files:**

- Modify: `lib/types.ts`, `lib/data/types.ts`, `lib/data/static.ts`, `lib/data/firebase.ts`
- Test: `tests/unit/create-demande.test.ts`, mise à jour `tests/unit/data-adapter.test.ts`

**Interfaces:**

- Produces: `DataAdapter.createDemande(data: Omit<Demande, 'id'>): Promise<string>` ; `DemandeType` inclut `'reparation'`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/create-demande.test.ts
import { describe, it, expect } from 'vitest';
import { StaticAdapter } from '@/lib/data/static';
import type { Demande } from '@/lib/types';

const sample: Omit<Demande, 'id'> = {
  type: 'vehicule',
  status: 'nouvelle',
  nom: 'Jean Test',
  email: 'jean@test.gp',
  telephone: '0690112233',
  message: 'Intéressé par la 308',
  createdAt: '2026-06-27T10:00:00.000Z',
  updatedAt: '2026-06-27T10:00:00.000Z',
  expiresAt: 1893456000000,
};

describe('StaticAdapter.createDemande', () => {
  it('renvoie un id (dev fallback, pas de throw)', async () => {
    const id = await new StaticAdapter().createDemande(sample);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/create-demande.test.ts`
Expected: FAIL — `createDemande is not a function`.

- [ ] **Step 3: Write minimal implementation**

Dans `lib/types.ts`, étendre `DemandeType` :

```ts
export type DemandeType = 'contact' | 'vehicule' | 'moto' | 'piece' | 'financement' | 'reparation';
```

Dans `lib/data/types.ts`, ajouter à l'interface `DataAdapter` (juste après `getDemandes`) :

```ts
  createDemande(data: Omit<Demande, 'id'>): Promise<string>;
```

(`Demande` est déjà importé dans ce fichier.)

Dans `lib/data/static.ts`, ajouter dans la classe `StaticAdapter` (près de `getDemandes`) :

```ts
  async createDemande(data: Omit<Demande, 'id'>): Promise<string> {
    warnDevFallback('createDemande');
    // Pas de persistance locale : on renvoie un id factice déterministe-ish.
    void data;
    return `dem-dev-${Date.now()}`;
  }
```

Dans `lib/data/firebase.ts`, ajouter dans la classe `FirebaseAdapter` (près de `getDemandes`) :

```ts
  async createDemande(data: Omit<Demande, 'id'>): Promise<string> {
    const docRef = await addDoc(this.demandesRef, data);
    return docRef.id;
  }
```

(`addDoc` et `this.demandesRef` existent déjà dans la classe.)

Mettre à jour les **2 mocks** `DataAdapter` de `tests/unit/data-adapter.test.ts` : après chaque ligne `getDemandes: async () => [],` (ou équivalent présent), ajouter :

```ts
      createDemande: async () => 'dem-test',
```

> Si le mock n'a pas de ligne `getDemandes`, ajouter `createDemande` juste avant la `}` qui ferme l'objet mock (même endroit que les autres méthodes).

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/create-demande.test.ts tests/unit/data-adapter.test.ts && npx tsc --noEmit`
Expected: tests PASS ; tsc sans nouvelle erreur.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/data/types.ts lib/data/static.ts lib/data/firebase.ts tests/unit/create-demande.test.ts tests/unit/data-adapter.test.ts
git commit -m "feat(demandes): DemandeType +reparation + createDemande (adapter)"
```

---

### Task 2: Règle Firestore `demandes`

**Files:**

- Modify: `firestore.rules`

- [ ] **Step 1: Ajouter la règle**

Dans `firestore.rules`, juste **avant** le bloc `match /reservations/{doc}` (ou à côté), insérer :

```
    // Demandes (leads formulaires) : création publique, lecture/update admin,
    // jamais hard delete (soft via status 'deleted'). Même contrat que reservations.
    match /demandes/{doc} {
      allow create;
      allow read, update: if isAdmin();
      allow delete: if false;
    }
```

- [ ] **Step 2: Vérifier l'équilibre des accolades**

Run: `bash -c 'o=$(grep -o "{" firestore.rules | wc -l); c=$(grep -o "}" firestore.rules | wc -l); echo "{ $o } $c"'`
Expected: nombres égaux.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(demandes): règle Firestore demandes (create public, read/update admin)"
```

> Déploiement (`firebase deploy --only firestore:rules`) = étape ops, au déploiement global.

---

### Task 3: Helper de mapping `demandeTypeFromSujet`

**Files:**

- Create: `lib/demandes.ts`
- Test: `tests/unit/demande-type-from-sujet.test.ts`

**Interfaces:**

- Produces: `demandeTypeFromSujet(sujet: string): DemandeType`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/demande-type-from-sujet.test.ts
import { describe, it, expect } from 'vitest';
import { demandeTypeFromSujet } from '@/lib/demandes';

describe('demandeTypeFromSujet', () => {
  it('mappe les sujets connus', () => {
    expect(demandeTypeFromSujet('Vente véhicule')).toBe('vehicule');
    expect(demandeTypeFromSujet('Vente moto')).toBe('moto');
    expect(demandeTypeFromSujet('Devis réparation')).toBe('reparation');
  });
  it('défaut = contact', () => {
    expect(demandeTypeFromSujet('Renseignement')).toBe('contact');
    expect(demandeTypeFromSujet('Location')).toBe('contact');
    expect(demandeTypeFromSujet('Autre')).toBe('contact');
    expect(demandeTypeFromSujet('')).toBe('contact');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/demande-type-from-sujet.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/demandes.ts
import type { DemandeType } from '@/lib/types';

/** Mappe le sujet du formulaire contact vers un DemandeType. */
export function demandeTypeFromSujet(sujet: string): DemandeType {
  switch (sujet) {
    case 'Vente véhicule':
      return 'vehicule';
    case 'Vente moto':
      return 'moto';
    case 'Devis réparation':
      return 'reparation';
    default:
      return 'contact';
  }
}

/** TTL RGPD : 13 mois après création (unix ms). */
export function demandeExpiry(nowMs: number): number {
  const d = new Date(nowMs);
  d.setMonth(d.getMonth() + 13);
  return d.getTime();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/demande-type-from-sujet.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/demandes.ts tests/unit/demande-type-from-sujet.test.ts
git commit -m "feat(demandes): helper demandeTypeFromSujet + demandeExpiry"
```

---

### Task 4: Persister `submitContact` (+ propager `ref`)

**Files:**

- Modify: `app/contact/actions.ts`, `app/contact/ContactForm.tsx`
- Test: `tests/unit/submit-contact-persist.test.ts`

**Interfaces:**

- Consumes: `createDemande` (Task 1), `demandeTypeFromSujet`/`demandeExpiry` (Task 3), `getAdapter`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/submit-contact-persist.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createDemande = vi.fn(async () => 'dem-1');
vi.mock('@/lib/data', () => ({ getAdapter: vi.fn(async () => ({ createDemande })) }));
vi.mock('@/lib/emails/send', () => ({ sendLeadEmails: vi.fn(async () => ({ emailed: true })) }));

import { sendLeadEmails } from '@/lib/emails/send';
import { submitContact } from '@/app/contact/actions';

const base = {
  prenom: 'Jean',
  nom: 'Test',
  email: 'jean@test.gp',
  tel: '0690112233',
  sujet: 'Vente véhicule',
  message: 'Bonjour je suis intéressé par ce véhicule en particulier.',
  ref: 'peugeot-308sw',
};

describe('submitContact persiste', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crée une demande au bon type + resourceRef puis email', async () => {
    const res = await submitContact(base);
    expect(createDemande).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'vehicule',
        status: 'nouvelle',
        nom: 'Jean Test',
        email: 'jean@test.gp',
        resourceRef: 'peugeot-308sw',
      })
    );
    expect(sendLeadEmails).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('email best-effort : ok même si sendLeadEmails rejette', async () => {
    vi.mocked(sendLeadEmails).mockRejectedValueOnce(new Error('smtp down'));
    const res = await submitContact(base);
    expect(createDemande).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('validation échoue → pas de création', async () => {
    const res = await submitContact({ ...base, email: 'pasemail' });
    expect(createDemande).not.toHaveBeenCalled();
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/submit-contact-persist.test.ts`
Expected: FAIL — `createDemande` jamais appelé / email primaire.

- [ ] **Step 3: Write minimal implementation**

Réécrire `app/contact/actions.ts` (en gardant la validation existante) :

```ts
'use server';

import { getAdapter } from '@/lib/data';
import { sendLeadEmails } from '@/lib/emails/send';
import { demandeTypeFromSujet, demandeExpiry } from '@/lib/demandes';
import type { Lead } from '@/lib/emails/lead';

export type ContactInput = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  sujet: string;
  message: string;
  filesCount?: number;
  ref?: string;
};

export type ContactResult =
  | { ok: true; ref: string; emailed: boolean }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function genRef(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function submitContact(input: ContactInput): Promise<ContactResult> {
  if (!input.prenom?.trim() || !input.nom?.trim())
    return { ok: false, error: 'Nom et prénom requis.' };
  if (!EMAIL_RE.test(input.email ?? '')) return { ok: false, error: 'Email invalide.' };
  if ((input.message ?? '').trim().length < 20)
    return { ok: false, error: 'Message trop court (min. 20 caractères).' };

  const ref = genRef('MSG-CP');
  const filesNote = input.filesCount
    ? `\n\n[${input.filesCount} fichier(s) joint(s) par le client — à récupérer auprès de lui]`
    : '';
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const messageFull = `${input.message.trim()}\n\nSujet : ${input.sujet}${filesNote}`;

  // 1) Persister d'abord (le lead ne doit jamais être perdu).
  let persisted = false;
  try {
    const adapter = await getAdapter();
    await adapter.createDemande({
      type: demandeTypeFromSujet(input.sujet),
      status: 'nouvelle',
      nom: `${input.prenom.trim()} ${input.nom.trim()}`,
      email: input.email.trim(),
      telephone: input.tel?.trim() ?? '',
      message: messageFull,
      ...(input.ref ? { resourceRef: input.ref } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: demandeExpiry(now),
    });
    persisted = true;
  } catch (err) {
    console.error('[submitContact] persistance échouée:', err);
  }

  // 2) Notifier par email (best-effort).
  const lead: Lead = {
    kind: 'contact',
    ref,
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: input.email.trim(),
    tel: input.tel?.trim() ?? '',
    sujet: input.sujet,
    message: input.message.trim() + filesNote,
  };
  let emailed = false;
  try {
    ({ emailed } = await sendLeadEmails(lead));
  } catch (err) {
    console.error('[submitContact] échec envoi email (best-effort):', err);
  }

  if (!persisted && !emailed) {
    return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' };
  }
  return { ok: true, ref, emailed };
}
```

Dans `app/contact/ContactForm.tsx`, propager le `ref` de l'URL. Repérer le state
qui stocke `urlRef` (sinon l'ajouter au state `data`) et l'inclure dans l'appel
`submitContact({ … })` (vers la ligne 130) :

```tsx
      ref: searchParams.get('ref') ?? undefined,
```

(Ajouter cette ligne dans l'objet passé à `submitContact`. `searchParams` est
déjà disponible via `useSearchParams()`.)

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/submit-contact-persist.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests) ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add app/contact/actions.ts app/contact/ContactForm.tsx tests/unit/submit-contact-persist.test.ts
git commit -m "feat(demandes): submitContact persiste la demande (+ ref) avant email best-effort"
```

---

### Task 5: Persister `submitRdv` (type reparation)

**Files:**

- Modify: `app/reparation/actions.ts`
- Test: `tests/unit/submit-rdv-persist.test.ts`

**Interfaces:**

- Consumes: `createDemande` (Task 1), `demandeExpiry` (Task 3), `getAdapter`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/submit-rdv-persist.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createDemande = vi.fn(async () => 'dem-2');
vi.mock('@/lib/data', () => ({ getAdapter: vi.fn(async () => ({ createDemande })) }));
vi.mock('@/lib/emails/send', () => ({ sendLeadEmails: vi.fn(async () => ({ emailed: true })) }));

import { sendLeadEmails } from '@/lib/emails/send';
import { submitRdv } from '@/app/reparation/actions';

const base = {
  prenom: 'Marie',
  nom: 'Test',
  email: 'marie@test.gp',
  tel: '0690112233',
  marque: 'Renault',
  modele: 'Clio',
  annee: '2018',
  immat: 'AB-123-CD',
  type: 'Révision',
  description: 'Révision annuelle complète à prévoir.',
  date: '2026-07-01',
  creneau: 'Matin',
};

describe('submitRdv persiste', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crée une demande type reparation avec détails aplatis', async () => {
    const res = await submitRdv(base);
    expect(createDemande).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reparation', status: 'nouvelle', nom: 'Marie Test' })
    );
    const arg = createDemande.mock.calls[0][0];
    expect(arg.message).toContain('Révision');
    expect(arg.message).toContain('2026-07-01');
    expect(res.ok).toBe(true);
  });

  it('ok même si email rejette', async () => {
    vi.mocked(sendLeadEmails).mockRejectedValueOnce(new Error('down'));
    const res = await submitRdv(base);
    expect(createDemande).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/submit-rdv-persist.test.ts`
Expected: FAIL — createDemande jamais appelé.

- [ ] **Step 3: Write minimal implementation**

Dans `app/reparation/actions.ts`, ajouter les imports et insérer la persistance
avant l'envoi email. Imports en tête :

```ts
import { getAdapter } from '@/lib/data';
import { demandeExpiry } from '@/lib/demandes';
```

Dans `submitRdv`, après la construction de `const lead: Lead = {…}` (et avant le
`try { sendLeadEmails }`), insérer :

```ts
const now = Date.now();
const nowIso = new Date(now).toISOString();
const vehiculeStr = [input.marque, input.modele, input.annee, input.immat]
  .map((s) => s?.trim())
  .filter(Boolean)
  .join(' ');
const messageFull = [
  `Véhicule : ${vehiculeStr || '—'}`,
  `Prestation : ${input.type}`,
  `Date : ${input.date} · Créneau : ${input.creneau}`,
  '',
  input.description.trim(),
].join('\n');

let persisted = false;
try {
  const adapter = await getAdapter();
  await adapter.createDemande({
    type: 'reparation',
    status: 'nouvelle',
    nom: `${input.prenom.trim()} ${input.nom.trim()}`,
    email: input.email.trim(),
    telephone: input.tel.trim(),
    message: messageFull,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: demandeExpiry(now),
  });
  persisted = true;
} catch (err) {
  console.error('[submitRdv] persistance échouée:', err);
}
```

Puis remplacer le bloc final `try { sendLeadEmails } catch { return error }` par
une version best-effort :

```ts
let emailed = false;
try {
  ({ emailed } = await sendLeadEmails(lead));
} catch (err) {
  console.error('[submitRdv] échec envoi email (best-effort):', err);
}
if (!persisted && !emailed) {
  return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' };
}
return { ok: true, ref, emailed };
```

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/submit-rdv-persist.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests) ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add app/reparation/actions.ts tests/unit/submit-rdv-persist.test.ts
git commit -m "feat(demandes): submitRdv persiste (type reparation, détails aplatis) avant email"
```

---

### Task 6: Lecture & gestion BO — `lib/admin/demandes-server.ts`

**Files:**

- Create: `lib/admin/demandes-server.ts`
- Create: `app/admin/(shell)/demandes/actions.ts`
- Test: `tests/unit/demandes-admin.test.ts`

**Interfaces:**

- Consumes: `getAdminFirestore`, `requireAdmin`, `writeAuditLog`.
- Produces: `getDemandesAdmin(opts?)`, server actions `updateDemandeStatus(id, status)`, `saveDemandeNote(id, note)`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/demandes-admin.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateMock = vi.fn(async () => undefined);
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ uid: 'u', email: 'a@b.gp' })),
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ collection: () => ({ doc: () => ({ update: updateMock }) }) })),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { updateDemandeStatus, saveDemandeNote } from '@/app/admin/(shell)/demandes/actions';

describe('actions demandes admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateDemandeStatus : auth + update + audit', async () => {
    await updateDemandeStatus('dem-1', 'en_cours');
    expect(requireAdmin).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'en_cours' }));
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it('saveDemandeNote : update notes', async () => {
    await saveDemandeNote('dem-1', 'rappeler après 17h');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'rappeler après 17h' })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/demandes-admin.test.ts`
Expected: FAIL — modules introuvables.

- [ ] **Step 3: Write minimal implementation**

Créer `lib/admin/demandes-server.ts` :

```ts
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Demande, DemandeStatus, DemandeType } from '@/lib/types';

/**
 * Lecture admin des demandes (Admin SDK, contourne les rules). TOUJOURS
 * appeler requireAdmin() en amont (PII : nom/email/téléphone).
 */
export async function getDemandesAdmin(opts?: {
  type?: DemandeType;
  status?: DemandeStatus;
  limit?: number;
}): Promise<Demande[]> {
  let q = getAdminFirestore().collection('demandes').orderBy('createdAt', 'desc');
  if (opts?.type) q = q.where('type', '==', opts.type) as typeof q;
  if (opts?.status) q = q.where('status', '==', opts.status) as typeof q;
  if (opts?.limit) q = q.limit(opts.limit) as typeof q;
  const snap = await q.get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Demande);
}
```

Créer `app/admin/(shell)/demandes/actions.ts` :

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { DemandeStatus } from '@/lib/types';

export async function updateDemandeStatus(id: string, status: DemandeStatus): Promise<void> {
  const session = await requireAdmin();
  await getAdminFirestore()
    .collection('demandes')
    .doc(id)
    .update({ status, updatedAt: new Date().toISOString() });
  await writeAuditLog({
    actor: session.email,
    action: status === 'deleted' ? 'delete' : 'update',
    resourceType: 'demande',
    resourceId: id,
  });
  revalidatePath('/admin/demandes');
}

export async function saveDemandeNote(id: string, note: string): Promise<void> {
  const session = await requireAdmin();
  await getAdminFirestore()
    .collection('demandes')
    .doc(id)
    .update({ notes: note, updatedAt: new Date().toISOString() });
  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'demande',
    resourceId: id,
  });
  revalidatePath('/admin/demandes');
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/demandes-admin.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests) ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/demandes-server.ts "app/admin/(shell)/demandes/actions.ts" tests/unit/demandes-admin.test.ts
git commit -m "feat(demandes): lecture admin + actions statut/notes (Admin SDK + audit)"
```

---

### Task 7: Page BO `/admin/demandes` + client + activation nav

**Files:**

- Create: `app/admin/(shell)/demandes/page.tsx`, `components/admin/DemandesClient.tsx`
- Modify: `components/admin/AdminSidebar.tsx`
- Test: `tests/unit/demandes-client.test.tsx`

**Interfaces:**

- Consumes: `getDemandesAdmin` (Task 6), `updateDemandeStatus`/`saveDemandeNote` (Task 6), `requireAdmin`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/demandes-client.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/admin/(shell)/demandes/actions', () => ({
  updateDemandeStatus: vi.fn(),
  saveDemandeNote: vi.fn(),
}));

import { DemandesClient } from '@/components/admin/DemandesClient';
import type { Demande } from '@/lib/types';

const demandes: Demande[] = [
  {
    id: 'd1',
    type: 'vehicule',
    status: 'nouvelle',
    nom: 'Jean Test',
    email: 'jean@test.gp',
    telephone: '0690112233',
    message: 'Intéressé par la 308',
    createdAt: '2026-06-27T10:00:00.000Z',
    updatedAt: '2026-06-27T10:00:00.000Z',
    expiresAt: 1893456000000,
  },
];

describe('DemandesClient', () => {
  it('affiche les demandes', () => {
    render(<DemandesClient demandes={demandes} />);
    expect(screen.getByText('Jean Test')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/demandes-client.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write minimal implementation**

Créer `components/admin/DemandesClient.tsx` (client ; segmented statut + liste +
détail dépliable + actions ; design iOS Clarity — réutiliser les classes
existantes type `ReservationsClient`) :

```tsx
'use client';

import { useState } from 'react';
import { updateDemandeStatus, saveDemandeNote } from '@/app/admin/(shell)/demandes/actions';
import type { Demande, DemandeStatus } from '@/lib/types';

const STATUSES: { key: DemandeStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'nouvelle', label: 'Nouvelles' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'traitee', label: 'Traitées' },
];

const TYPE_LABEL: Record<string, string> = {
  contact: 'Contact',
  vehicule: 'Véhicule',
  moto: 'Moto',
  piece: 'Pièce',
  financement: 'Financement',
  reparation: 'Réparation',
};

export function DemandesClient({ demandes }: { demandes: Demande[] }) {
  const [filter, setFilter] = useState<DemandeStatus | 'all'>('all');
  const visible = demandes.filter(
    (d) => d.status !== 'deleted' && (filter === 'all' || d.status === filter)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(s.key)}
            className="rounded-[10px] px-3 py-1.5 text-body-sm"
            style={{
              background: filter === s.key ? 'var(--blue)' : 'var(--surface)',
              color: filter === s.key ? '#fff' : 'var(--text)',
              border: '1px solid rgba(198,198,200,0.5)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-body-sm" style={{ color: 'rgba(28,28,30,0.5)' }}>
          Aucune demande.
        </p>
      )}

      {visible.map((d) => (
        <DemandeRow key={d.id} d={d} />
      ))}
    </div>
  );
}

function DemandeRow({ d }: { d: Demande }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(d.notes ?? '');

  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198,198,200,0.5)' }}
    >
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left">
        <span className="text-body-sm font-medium" style={{ color: 'var(--text)' }}>
          {d.nom}
        </span>
        <span className="text-body-sm" style={{ color: 'rgba(28,28,30,0.5)' }}>
          {' '}
          · {TYPE_LABEL[d.type] ?? d.type} · {new Date(d.createdAt).toLocaleDateString('fr-FR')} ·{' '}
          {d.status}
        </span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 text-body-sm" style={{ color: 'var(--text)' }}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{d.message}</p>
          <div className="flex gap-4">
            <a href={`tel:${d.telephone}`} style={{ color: 'var(--blue)' }}>
              {d.telephone}
            </a>
            <a href={`mailto:${d.email}`} style={{ color: 'var(--blue)' }}>
              {d.email}
            </a>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => updateDemandeStatus(d.id, 'en_cours')}>
              En cours
            </button>
            <button type="button" onClick={() => updateDemandeStatus(d.id, 'traitee')}>
              Traitée
            </button>
            <button type="button" onClick={() => updateDemandeStatus(d.id, 'deleted')}>
              Supprimer
            </button>
          </div>
          <form action={() => saveDemandeNote(d.id, note)} className="flex flex-col gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Notes internes"
              className="rounded-[10px] p-2"
              style={{ border: '1px solid rgba(198,198,200,0.6)' }}
            />
            <button type="submit" className="self-start">
              Enregistrer la note
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

Créer `app/admin/(shell)/demandes/page.tsx` :

```tsx
import { requireAdmin } from '@/lib/admin/auth';
import { getDemandesAdmin } from '@/lib/admin/demandes-server';
import { DemandesClient } from '@/components/admin/DemandesClient';

export const dynamic = 'force-dynamic';

export default async function DemandesPage() {
  await requireAdmin();
  const demandes = await getDemandesAdmin({ limit: 100 });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-title text-h2" style={{ color: 'var(--text)' }}>
          Demandes
        </h1>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Messages de contact et demandes de RDV reçus via le site.
        </p>
      </div>
      <DemandesClient demandes={demandes} />
    </section>
  );
}
```

Dans `components/admin/AdminSidebar.tsx`, l'entrée `Demandes` passe à
`enabled: true` :

```tsx
{ href: '/admin/demandes', label: 'Demandes', icon: MessageSquare, enabled: true },
```

- [ ] **Step 4: Run test + build**

Run: `npx vitest run tests/unit/demandes-client.test.tsx && npm run build`
Expected: test PASS ; build vert ; route `/admin/demandes` listée (dynamique).

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(shell)/demandes/page.tsx" components/admin/DemandesClient.tsx components/admin/AdminSidebar.tsx tests/unit/demandes-client.test.tsx
git commit -m "feat(demandes): page BO /admin/demandes + client + activation nav"
```

---

### Task 8: TTL + suite complète

**Files:**

- Modify: `scripts/setup-ttl-policies.ts` (étendre à `demandes` si absent)
- Create: `tests/e2e/demandes-admin.spec.ts`

- [ ] **Step 1: Vérifier/étendre le TTL `demandes`**

Run: `grep -n "demandes\|expiresAt\|collection" scripts/setup-ttl-policies.ts`
Si `demandes` n'est pas dans la liste des collections à TTL : ajouter `'demandes'`
(champ `expiresAt`) au même format que les collections existantes du script.
Si le script couvre déjà `demandes` ou toutes les collections génériquement →
aucun changement.

- [ ] **Step 2: E2E léger**

```ts
// tests/e2e/demandes-admin.spec.ts
import { test, expect } from '@playwright/test';

// Smoke : la route admin existe (auth gère la redirection si non connecté).
test('la route /admin/demandes répond (pas de 500)', async ({ page }) => {
  const res = await page.goto('/admin/demandes');
  expect(res?.status()).toBeLessThan(500);
});
```

- [ ] **Step 3: Suite complète + build**

Run:

```bash
npx vitest run
npm run build
```

Expected: tous les unitaires verts (dont les nouveaux fichiers demandes), build vert.

- [ ] **Step 4: Commit**

```bash
git add scripts/setup-ttl-policies.ts tests/e2e/demandes-admin.spec.ts
git commit -m "feat(demandes): TTL demandes + E2E smoke"
```

---

## Self-Review

**Spec coverage :**

- `DemandeType` +reparation + `createDemande` → Task 1. ✓
- Règle Firestore `demandes` → Task 2. ✓
- Mapping sujet→type → Task 3. ✓
- Persistance submitContact (+ ref) avant email → Task 4. ✓
- Persistance submitRdv (reparation, message aplati) → Task 5. ✓
- Lecture admin + actions statut/notes (audit) → Task 6. ✓
- Page BO + client (filtres/détail/statuts/notes) + activation nav → Task 7. ✓
- TTL RGPD + E2E → Task 8. ✓
- Persist-avant-email (no lead perdu) → Tasks 4 & 5. ✓

**Placeholder scan :** aucun TODO/TBD ; code complet. Les renvois « repérer le
state urlRef » (Task 4) et « vérifier setup-ttl-policies » (Task 8) fournissent
la commande/grep exacte et l'action conditionnelle.

**Type consistency :** `Demande`/`DemandeType`/`DemandeStatus` stables ;
`createDemande(Omit<Demande,'id'>)` identique adapter↔consommateurs ;
`getDemandesAdmin`/`updateDemandeStatus`/`saveDemandeNote`/`demandeTypeFromSujet`/
`demandeExpiry` noms stables across tasks ; `resourceType: 'demande'` (existe déjà).

## Ordre de dépendance

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. (4 & 5 dépendent de 1+3 ; 6 de 1 ; 7 de 6 ; 8 de tout.)
