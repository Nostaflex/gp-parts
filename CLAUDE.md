# GP Parts — CLAUDE.md

Living rules for Claude on this project. Updated after every correction.
**Always read `tasks/lessons.md` at session start** to avoid repeating past mistakes.

---

## Workflow

- **Plan mode by default** — any task with 3+ steps or an architectural decision starts with a plan. Stop and re-plan if something goes sideways.
- **Verify before done** — never mark a task complete without proving it works: build green, tests pass, behavior confirmed in browser.
- **Autonomous bug fixing** — when given a bug report, fix it using logs and failing tests. No hand-holding required.
- **After any correction** — immediately update `tasks/lessons.md` with the pattern so the mistake doesn't repeat.
- **Elegance check** — for non-trivial changes, ask "is there a more elegant way?" before presenting the solution.

---

## Stack

Next.js 14.2 App Router · React 18.3 · TypeScript strict · Tailwind 3.4 · Vitest · Playwright  
Repo: github.com/Nostaflex/gp-parts (private) · Prod: gp-parts.vercel.app

---

## Two Design Systems — NEVER MIX (in new code)

> **Exception documentée :** `app/admin/AdminDashboardClient.tsx` utilise Volcanic Clarity
> (héritage Phase 1-2, décision intentionnelle pour cohérence visuelle). Cette dette sera
> soldée en Phase 4.5. Ne pas reproduire ce mélange dans de nouveaux composants admin.

| Route                      | System           | Tokens                                                           |
| -------------------------- | ---------------- | ---------------------------------------------------------------- |
| `app/` (storefront)        | Volcanic Clarity | `bg-cream` `text-volcanic` `border-lin` `bg-ivory` `text-basalt` |
| `app/admin/` (back-office) | iOS Clarity      | `var(--blue)` `var(--bg)` `var(--surface)` `var(--text)`         |

Using Volcanic Clarity tokens inside `app/admin/` or iOS Clarity tokens in the storefront is a **critical violation**.

---

## Anti-Bugs — NEVER REINTRODUCE

### Bug #1 — Nesting `<a><button>`

```tsx
// ✅ Navigation → ButtonLink
<ButtonLink href="/panier">Voir le panier</ButtonLink>

// ✅ JS action → Button
<Button onClick={fn}>Payer</Button>

// ❌ FORBIDDEN — invalid HTML, breaks accessibility
<Link href="/panier"><Button>Voir le panier</Button></Link>
<a href="/panier"><button>Voir le panier</button></a>
```

### Bug #2 — Infinite loop URL↔state in catalogue

```tsx
// ✅ Anti-loop flag is mandatory in app/catalogue/page.tsx
const internalChange = useRef(false);

// URL → state (external navigation): skip if internalChange is true
// state → URL (filter interaction): set internalChange = true before router.replace

// ❌ FORBIDDEN — removing this flag causes infinite re-renders
```

### Bug #3 — Learnings prod (2026-06/07) — NEVER REINTRODUCE

- **Routes admin : JAMAIS le SDK client Firebase** — les rules `isAdmin`
  rejettent le client non-authentifié ; toute route serveur admin passe par
  le **Firebase Admin SDK** (cause du bug orders/paiement prod, fixé #41).
- **CSP nonce + ISR/SSG incompatibles** (Next 15) : le combo casse
  l'hydratation. Choisir : `force-dynamic`, SRI, ou `unsafe-inline`.
- **CSP sans `unsafe-eval` tue l'hydratation en `next dev`** → toujours
  vérifier en `build` + `start`, jamais conclure depuis le dev server.
- **« KO Node 24 » = mythe réfuté** : `npm ci` règle le problème.
- **Husky non-exécutable** après clone : `chmod +x .husky/*`.
- **Stripe** : montant recalculé serveur (jamais confiance au client),
  webhook idempotent — invariants, pas des options.

### Bug #4 — Race condition on checkout

```tsx
// ✅ setOrderPlaced(true) BEFORE clearCart()
setOrderPlaced(true);
clearCart();
router.push('/commande/confirmation');

// ❌ FORBIDDEN — clearCart() before the flag triggers redirect to /panier
clearCart();
router.push('/commande/confirmation'); // never reached
```

---

## Conventions

### Prices

Always stored as **integers in centimes**. Use `formatPrice()` for display.

```ts
// ✅
const price = 2990; // 29,90 €
formatPrice(price); // → "29,90 €"

// ❌
const price = 29.9; // floating point errors
```

### localStorage keys

All keys must be prefixed `gpparts-`.

```ts
// ✅
localStorage.setItem('gpparts-cart', ...);

// ❌
localStorage.setItem('cart', ...); // collision risk
```

### Tax

VAT rate for Guadeloupe (971): `VAT_RATE = 0.085` declared in `lib/config.ts`.

### Import order

```ts
import { useState } from 'react'; // 1. React
import { useRouter } from 'next/navigation'; // 2. Next.js
import { formatPrice } from '@/lib/utils'; // 3. Internal lib
import { Button } from '@/components/ui/Button'; // 4. Components
import type { Product } from '@/lib/types'; // 5. Types (always last)
```

### Autocomplete on all form inputs

```tsx
<input name="firstName" autoComplete="given-name" />
<input name="email" autoComplete="email" type="email" />
<input name="phone" autoComplete="tel" type="tel" />
```

---

## Architecture Decisions (ADRs)

| ADR | Decision                                                       | Status  |
| --- | -------------------------------------------------------------- | ------- |
| 001 | Firebase Firestore (plan Spark, free)                          | Decided |
| 002 | Data Adapter pattern — FirebaseAdapter livré (Phase 3)         | Active  |
| 003 | Vercel Hobby (free), auto-deploy from `main`                   | Active  |
| 004 | Firebase Auth (login) — a remplacé le Basic Auth v1 en Phase 4 | Active  |
| 005 | main protégée : PR + CI obligatoires                           | Active  |

**Never call Firebase directly from components or pages — always go through the Data Adapter interface.**

---

## Completed Phases

| Phase                     | Scope                                                                                          | PR(s)          | Status  |
| ------------------------- | ---------------------------------------------------------------------------------------------- | -------------- | ------- |
| 1 — MVP                   | Storefront, catalogue, panier, checkout, admin Basic Auth                                      | Initial commit | ✅ Done |
| 2 — Tests                 | 111 Vitest unit + 17 Playwright E2E, CI (lint/typecheck/build/tests+coverage)                  | #2 #3 #4       | ✅ Done |
| 3 — Firebase              | Firestore emulator, FirebaseAdapter, Data Adapter pattern, audit qualité (10 fixes + 36 tests) | #5 #6 #7       | ✅ Done |
| 4 — Firebase Cloud + Auth | Firebase Auth login, Zod validation, SSR fix, seeder cloud, Auth emulator                      | #8 (PR)        | ✅ Done |

## Phases 5-6 + prod (état réel, mis à jour 2026-07-11)

| Phase / chantier         | Scope                                                                            | PR(s) | Status  |
| ------------------------ | -------------------------------------------------------------------------------- | ----- | ------- |
| 5 — Admin CRUD           | CRUD produits admin, **soft-delete 4 couches** (UI, adapter, rules, seed)        | #24   | ✅ Done |
| 6 — Stripe               | Checkout Stripe, **webhook idempotent**, montant TOUJOURS recalculé côté serveur | #25   | ✅ Done |
| Réservations `/location` | Zod + adapter + emails + admin                                                   | #27   | ✅ Done |
| Feature flags            | Back-office `meta/featureFlags`                                                  | #30   | ✅ Done |
| Fix orders prod          | Routes admin passées au **Firebase Admin SDK** (SDK client non-auth vs rules)    | #41   | ✅ Done |
| Audit UI/UX + SEO        | 53 findings, lots A-C livrés                                                     | #31+  | Partiel |

**Reste ouvert** : preuve Stripe test-mode e2e · IG/FB (app Meta bloquée) ·
révoquer le VERCEL_TOKEN exposé · lots D (lourd) / E (polish) de l'audit.

**main est PROTÉGÉE : PR + CI obligatoires — jamais de push direct.**
Avant tout merge : skill projet `phase-transition` (23 bugs réels encodés).

---

## Verification Checklist Before Done

```bash
npm run typecheck   # 0 TypeScript errors
npm run lint        # 0 warnings
npm run build       # build green, routes compiled
npm run test:unit   # all Vitest tests pass
```

For any change touching the checkout flow, catalogue filters, or admin statuses: verify in browser via the full user journey.

---

## Key File Locations

```
lib/types.ts          — Product, CartItem, Order types
lib/products.ts       — Static catalogue (prices in centimes)
lib/config.ts         — VAT_RATE, DELIVERY_FEE, constants
lib/utils.ts          — formatPrice, slugify, generateOrderId, cn
components/ui/Button.tsx — buttonClasses, Button, ButtonLink (polymorphic)
app/commande/page.tsx — checkout (orderPlaced flag, autocomplete attrs)
app/catalogue/page.tsx — filters (internalChange flag, URL↔state sync)
middleware.ts         — Basic Auth for /admin/* routes
```
