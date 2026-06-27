# Anti-spam intake — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fermer l'écriture publique directe de `demandes`/`reservations` (Admin SDK + règles `create: if false`) et filtrer les bots via un honeypot invisible sur les 3 formulaires.

**Architecture:** Un module server-only `lib/server/intake.ts` écrit via l'Admin SDK (contourne les rules) ; les server actions l'utilisent à la place du client SDK. Les règles Firestore passent à `create: if false`. Un champ honeypot caché dans chaque formulaire déclenche un drop silencieux côté serveur.

**Tech Stack:** Next.js 14.2 App Router, Firestore Admin SDK, Vitest + happy-dom + RTL.

## Global Constraints

- Périmètre : `demandes` (contact + RDV) + `reservations` (location). `orders` **hors scope**.
- Honeypot = champ `website` ; si non vide → **drop silencieux** (réponse `ok` factice, ni persistance ni email).
- Admin SDK + règle `create: if false` partent ensemble (sinon les écritures actuelles cassent).
- Persist-avant-email (feature B) préservé ; email best-effort préservé.
- Locale FR ; imports React → Next → lib → components → types ; TDD strict ; `--no-verify` interdit au commit final.

---

### Task 1: Module `lib/server/intake.ts`

**Files:**

- Create: `lib/server/intake.ts`
- Test: `tests/unit/intake.test.ts`

**Interfaces:**

- Produces: `createDemandeIntake(data: Omit<Demande,'id'>): Promise<string>`, `createReservationIntake(data: Omit<Reservation,'id'>): Promise<string>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/intake.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const addMock = vi.fn(async () => ({ id: 'new-id' }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ collection: () => ({ add: addMock }) })),
}));

import { createDemandeIntake, createReservationIntake } from '@/lib/server/intake';

describe('intake (Admin SDK)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createDemandeIntake add + renvoie id', async () => {
    const id = await createDemandeIntake({ type: 'contact' } as never);
    expect(addMock).toHaveBeenCalledWith({ type: 'contact' });
    expect(id).toBe('new-id');
  });

  it('createReservationIntake add + renvoie id', async () => {
    const id = await createReservationIntake({ locationCarId: 'x' } as never);
    expect(addMock).toHaveBeenCalled();
    expect(id).toBe('new-id');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/intake.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/server/intake.ts
// Écritures publiques (formulaires) via Admin SDK — contourne les Security
// Rules. Les règles `demandes`/`reservations` sont `create: if false` ; seules
// ces fonctions (côté serveur, après validation + honeypot) écrivent.
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Demande } from '@/lib/types';
import type { Reservation } from '@/lib/reservations';

export async function createDemandeIntake(data: Omit<Demande, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('demandes').add(data);
  return ref.id;
}

export async function createReservationIntake(data: Omit<Reservation, 'id'>): Promise<string> {
  const ref = await getAdminFirestore().collection('reservations').add(data);
  return ref.id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/intake.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests) ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add lib/server/intake.ts tests/unit/intake.test.ts
git commit -m "feat(anti-spam): module intake (écritures Admin SDK)"
```

---

### Task 2: `submitContact` → intake + honeypot

**Files:**

- Modify: `app/contact/actions.ts`
- Test: `tests/unit/submit-contact-persist.test.ts` (mise à jour)

**Interfaces:**

- Consumes: `createDemandeIntake` (Task 1).

- [ ] **Step 1: Mettre à jour le test (rouge)**

Remplacer le mock `@/lib/data` par un mock de `@/lib/server/intake`, et ajouter
le cas honeypot. Réécrire `tests/unit/submit-contact-persist.test.ts` :

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createDemandeIntake = vi.fn(async () => 'dem-1');
vi.mock('@/lib/server/intake', () => ({ createDemandeIntake }));
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

describe('submitContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste via intake au bon type + ref, puis email', async () => {
    const res = await submitContact(base);
    expect(createDemandeIntake).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'vehicule', resourceRef: 'peugeot-308sw' })
    );
    expect(sendLeadEmails).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('ok même si email rejette', async () => {
    vi.mocked(sendLeadEmails).mockRejectedValueOnce(new Error('down'));
    expect((await submitContact(base)).ok).toBe(true);
  });

  it('honeypot rempli → drop silencieux (ni intake ni email)', async () => {
    const res = await submitContact({ ...base, website: 'http://spam.ru' });
    expect(createDemandeIntake).not.toHaveBeenCalled();
    expect(sendLeadEmails).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('validation échoue → pas de création', async () => {
    const res = await submitContact({ ...base, email: 'pasemail' });
    expect(createDemandeIntake).not.toHaveBeenCalled();
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/submit-contact-persist.test.ts`
Expected: FAIL (intake non utilisé / honeypot non géré).

- [ ] **Step 3: Implémenter**

Dans `app/contact/actions.ts` :

- ajouter `website?: string;` au type `ContactInput`,
- remplacer l'import `getAdapter` par `import { createDemandeIntake } from '@/lib/server/intake';`,
- en **première instruction** de `submitContact`, le drop honeypot,
- remplacer `const adapter = await getAdapter(); await adapter.createDemande({...})` par `await createDemandeIntake({...})`.

```ts
// imports : retirer `import { getAdapter } from '@/lib/data';`
import { createDemandeIntake } from '@/lib/server/intake';

// type :
export type ContactInput = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  sujet: string;
  message: string;
  filesCount?: number;
  ref?: string;
  website?: string;
};

// dans submitContact, TOUT EN HAUT (avant la validation) :
// Honeypot : un humain ne remplit jamais ce champ → drop silencieux.
if (input.website && input.website.trim() !== '') {
  return { ok: true, ref: genRef('MSG-CP'), emailed: false };
}

// remplacer le bloc persistance :
let persisted = false;
try {
  await createDemandeIntake({
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
```

(Le reste — email best-effort, return — inchangé.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/submit-contact-persist.test.ts && npx tsc --noEmit`
Expected: PASS (4 tests) ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add app/contact/actions.ts tests/unit/submit-contact-persist.test.ts
git commit -m "feat(anti-spam): submitContact via intake + honeypot"
```

---

### Task 3: `submitRdv` → intake + honeypot

**Files:**

- Modify: `app/reparation/actions.ts`
- Test: `tests/unit/submit-rdv-persist.test.ts` (mise à jour)

**Interfaces:**

- Consumes: `createDemandeIntake` (Task 1).

- [ ] **Step 1: Mettre à jour le test (rouge)**

Réécrire `tests/unit/submit-rdv-persist.test.ts` (mock intake + cas honeypot) :

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createDemandeIntake = vi.fn(async (_d: Record<string, unknown>) => 'dem-2');
vi.mock('@/lib/server/intake', () => ({ createDemandeIntake }));
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

describe('submitRdv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste type reparation + détails aplatis', async () => {
    const res = await submitRdv(base);
    expect(createDemandeIntake).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reparation' })
    );
    expect(createDemandeIntake.mock.calls[0][0].message).toContain('2026-07-01');
    expect(res.ok).toBe(true);
  });

  it('honeypot rempli → drop silencieux', async () => {
    const res = await submitRdv({ ...base, website: 'x' });
    expect(createDemandeIntake).not.toHaveBeenCalled();
    expect(sendLeadEmails).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/submit-rdv-persist.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Dans `app/reparation/actions.ts` :

- ajouter `website?: string;` à `RdvInput`,
- remplacer `import { getAdapter } from '@/lib/data';` par `import { createDemandeIntake } from '@/lib/server/intake';`,
- drop honeypot en première instruction,
- remplacer `const adapter = await getAdapter(); await adapter.createDemande({...})` par `await createDemandeIntake({...})`.

```ts
// imports : retirer getAdapter ; ajouter :
import { createDemandeIntake } from '@/lib/server/intake';

// RdvInput : ajouter `website?: string;`

// dans submitRdv, TOUT EN HAUT :
if (input.website && input.website.trim() !== '') {
  return { ok: true, ref: genRef('RDV-CP'), emailed: false };
}

// remplacer la persistance :
let persisted = false;
try {
  await createDemandeIntake({
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

(Reste inchangé.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/submit-rdv-persist.test.ts && npx tsc --noEmit`
Expected: PASS ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add app/reparation/actions.ts tests/unit/submit-rdv-persist.test.ts
git commit -m "feat(anti-spam): submitRdv via intake + honeypot"
```

---

### Task 4: `validateReservation` → intake + honeypot

**Files:**

- Modify: `app/location/actions.ts`
- Test: `tests/unit/reservation-intake.test.ts`

**Interfaces:**

- Consumes: `createReservationIntake` (Task 1).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/reservation-intake.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createReservationIntake = vi.fn(async () => 'res-1');
const getLocationCarById = vi.fn(async () => ({
  id: 'car-1',
  disponible: true,
  prixJour: 5000,
}));
vi.mock('@/lib/server/intake', () => ({ createReservationIntake }));
vi.mock('@/lib/data', () => ({ getAdapter: vi.fn(async () => ({ getLocationCarById })) }));

import { validateReservation } from '@/app/location/actions';

const base = {
  locationCarId: 'car-1',
  dateDepart: '2026-07-10',
  dateRetour: '2026-07-12',
  prenom: 'Paul',
  nom: 'Test',
  email: 'paul@test.gp',
  telephone: '0690112233',
  permis: 'B',
  consent: true,
};

describe('validateReservation honeypot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('honeypot rempli → pas de création', async () => {
    const res = await validateReservation({ ...base, website: 'spam' } as never);
    expect(createReservationIntake).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });
});
```

> Note implémenteur : ajuster les champs de `getLocationCarById` mocké si la
> validation lit d'autres propriétés (lire `app/location/actions.ts` pour la
> forme attendue de la voiture).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/reservation-intake.test.ts`
Expected: FAIL — `website` non géré / `createReservationIntake` introuvable.

- [ ] **Step 3: Implémenter**

Dans `app/location/actions.ts` :

- ajouter `website?: string;` à l'objet `input` de `validateReservation`,
- importer `import { createReservationIntake } from '@/lib/server/intake';`,
- drop honeypot en tête de la fonction (renvoyer une réponse `ok`-like conforme
  au type `ReservationValidationResult` — lire le type pour le shape exact, ex.
  `{ ok: true, reservationId: 'dropped' }` ou la forme succès existante),
- remplacer `const id = await adapter.createReservation(data);` par
  `const id = await createReservationIntake(data);` (garder `getAdapter()` pour
  la lecture `getLocationCarById`).

```ts
// import :
import { createReservationIntake } from '@/lib/server/intake';

// signature input : ajouter `website?: string;`

// première instruction de validateReservation :
if (input.website && input.website.trim() !== '') {
  // Honeypot : réponse succès factice, aucune création.
  return { ok: true, reservationId: 'dropped' } as ReservationValidationResult;
}

// remplacer la création :
const id = await createReservationIntake(data);
```

> Adapter la forme de la réponse honeypot au type `ReservationValidationResult`
> réel (lire sa définition en haut de `app/location/actions.ts`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/reservation-intake.test.ts && npx tsc --noEmit`
Expected: PASS ; tsc propre.

- [ ] **Step 5: Commit**

```bash
git add app/location/actions.ts tests/unit/reservation-intake.test.ts
git commit -m "feat(anti-spam): validateReservation via intake + honeypot"
```

---

### Task 5: Champ honeypot dans les 3 formulaires

**Files:**

- Modify: `app/contact/ContactForm.tsx`, `app/reparation/RdvForm.tsx`, `app/location/LocationClient.tsx`

**Interfaces:**

- Consumes: les champs `website?` ajoutés aux inputs (Tasks 2/3/4).

- [ ] **Step 1: Ajouter le honeypot + le state**

Dans **chaque** formulaire :

1. ajouter un state `const [website, setWebsite] = useState('');` (ou un champ
   `website` dans l'objet `data` existant),
2. rendre le champ piège **avant** le bouton submit :

```tsx
{
  /* Honeypot anti-spam : invisible pour un humain, rempli par les bots. */
}
<input
  type="text"
  name="website"
  tabIndex={-1}
  autoComplete="off"
  aria-hidden="true"
  value={website}
  onChange={(e) => setWebsite(e.target.value)}
  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
/>;
```

3. passer `website` à l'appel du server action :
   - `ContactForm` (appel `submitContact({...})`, vers L130) → ajouter `website,`
   - `RdvForm` (appel `submitRdv(data)`, vers L136) → ajouter `website` dans
     l'objet `data` envoyé (ou `submitRdv({ ...data, website })`)
   - `LocationClient` (appel `validateReservation({...})`, vers L114) → ajouter
     `website,`

> Pour `RdvForm`/`LocationClient` qui passent un objet `data` complet, le plus
> simple est d'inclure `website` dans cet objet au moment de l'appel :
> `submitRdv({ ...data, website })`.

- [ ] **Step 2: Vérifier (build + présence du champ)**

Run: `npm run build`
Expected: build vert.

Vérification manuelle rapide : `grep -c 'name="website"' app/contact/ContactForm.tsx app/reparation/RdvForm.tsx app/location/LocationClient.tsx` → chacun `1`.

- [ ] **Step 3: Commit**

```bash
git add app/contact/ContactForm.tsx app/reparation/RdvForm.tsx app/location/LocationClient.tsx
git commit -m "feat(anti-spam): champ honeypot invisible dans les 3 formulaires"
```

---

### Task 6: Règles Firestore `create: if false`

**Files:**

- Modify: `firestore.rules`

- [ ] **Step 1: Fermer la création client**

Dans `firestore.rules`, dans les blocs `demandes` et `reservations`, remplacer
`allow create;` par `allow create: if false;` :

```
    match /demandes/{doc} {
      allow create: if false;
      allow read, update: if isAdmin();
      allow delete: if false;
    }
```

```
    match /reservations/{doc} {
      allow create: if false;
      allow read, update: if isAdmin();
      allow delete: if false;
    }
```

- [ ] **Step 2: Vérifier l'équilibre des accolades**

Run: `bash -c 'o=$(grep -o "{" firestore.rules | wc -l); c=$(grep -o "}" firestore.rules | wc -l); echo "{ $o } $c"'`
Expected: nombres égaux ; `grep -c "allow create: if false" firestore.rules` → ≥ 2.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(anti-spam): demandes/reservations create:if false (Admin SDK only)"
```

> ⚠️ Déploiement (`firebase deploy --only firestore:rules`) à faire **en même
> temps** que le merge (les écritures sont déjà passées en Admin SDK aux Tasks
> 2-4, donc sûr).

---

### Task 7: Suite complète + build

- [ ] **Step 1: Suite + build**

Run:

```bash
npx vitest run
npm run build
```

Expected: tous les unitaires verts (dont intake + honeypot), build vert.

- [ ] **Step 2: Commit (si ajustements)**

```bash
git add -A && git commit -m "test(anti-spam): suite complète verte"
```

(Si rien à committer, ignorer.)

---

## Self-Review

**Spec coverage :**

- Module intake Admin SDK → Task 1. ✓
- submitContact/submitRdv/validateReservation → intake → Tasks 2/3/4. ✓
- Honeypot drop silencieux (3 actions) → Tasks 2/3/4. ✓
- Champ honeypot invisible (3 forms) → Task 5. ✓
- Règles `create: if false` → Task 6. ✓
- Admin SDK + règle ensemble → Tasks 2-4 avant Task 6 ; déploiement noté. ✓

**Placeholder scan :** aucun TODO/TBD ; code complet. Les renvois « lire le type
`ReservationValidationResult` » (Task 4) et « forme de la voiture mockée »
fournissent le fichier exact + l'action.

**Type consistency :** `createDemandeIntake`/`createReservationIntake` signatures
stables (Task 1 → 2/3/4) ; `website?: string` ajouté aux 3 inputs ; honeypot
renvoie une réponse conforme au type de retour de chaque action.

## Ordre de dépendance

1 → 2 → 3 → 4 → 5 → 6 → 7. (2/3/4 dépendent de 1 ; 5 de 2/3/4 ; 6 indépendant mais à shipper avec 2-4 ; 7 final.)
