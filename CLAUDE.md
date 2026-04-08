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

## Two Design Systems — NEVER MIX

| Route | System | Tokens |
|---|---|---|
| `app/` (storefront) | Volcanic Clarity | `bg-cream` `text-volcanic` `border-lin` `bg-ivory` `text-basalt` |
| `app/admin/` (back-office) | iOS Clarity | `var(--blue)` `var(--bg)` `var(--surface)` `var(--text)` |

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

### Bug #3 — Race condition on checkout

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
formatPrice(price);  // → "29,90 €"

// ❌
const price = 29.90; // floating point errors
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
import { useState } from 'react';           // 1. React
import { useRouter } from 'next/navigation'; // 2. Next.js
import { formatPrice } from '@/lib/utils';  // 3. Internal lib
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

| ADR | Decision | Status |
|---|---|---|
| 001 | Firebase Firestore (plan Spark, free) | Decided |
| 002 | Data Adapter pattern: StaticAdapter now → FirebaseAdapter in Phase 3-4 | Implementing |
| 003 | Vercel Hobby (free), auto-deploy from `main` | Active |
| 004 | Basic Auth middleware (v1) → Firebase Auth in Phase 4 | v1 active |

**Never call Firebase directly from components or pages — always go through the Data Adapter interface.**

---

## Current Roadmap Phase: Phase 2 — Tests

Do not start Phase N+1 until Phase N Definition of Done is met and CI is green.

Phase 2 remaining:
- [ ] 3 Playwright E2E anti-regression tests (one per known bug)
- [ ] Admin smoke test (login → dashboard → orders)
- [ ] Vitest unit tests for `lib/` (formatPrice, slugify, generateOrderId)
- [ ] `npm run test:unit` added to CI workflow

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
