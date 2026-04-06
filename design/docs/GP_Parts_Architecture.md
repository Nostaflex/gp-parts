# Architecture Technique — GP Parts

**Dernière mise à jour** : 2026-04-06
**Statut** : Phase 2 — Tests & Audit Qualité (terminée)
**Prochaine phase** : Phase 3 — Firebase Émulateur

---

## 1. Vue d'ensemble

### Stack technique

| Domaine                 | Technologie              | Version  |
| ----------------------- | ------------------------ | -------- |
| Framework               | Next.js App Router       | 14.x     |
| Runtime React           | React                    | 18.3.1   |
| Langage                 | TypeScript               | 5.4      |
| Styling                 | Tailwind CSS             | 3.4      |
| Hosting                 | Vercel Hobby (gratuit)   | -        |
| Git                     | GitHub (privé)           | -        |
| Tests unitaires         | Vitest + happy-dom       | 1.6      |
| Tests composants        | React Testing Library    | -        |
| Tests E2E               | Playwright               | -        |
| Linting                 | ESLint + security plugin | 8.x      |
| Formatage               | Prettier                 | 3.x      |
| Pre-commit hooks        | Husky + lint-staged      | 9.x      |
| Base de données (cible) | Firebase Firestore       | Phase 3+ |

### Architecture haut niveau

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (Hosting)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Next.js 14 App Router (Frontend)            │    │
│  │  ┌──────────────┐  ┌──────────────────────────────┐ │    │
│  │  │  Storefront  │  │   Admin Back-office          │ │    │
│  │  │ (Public)     │  │  (Protected middleware)      │ │    │
│  │  └──────────────┘  └──────────────────────────────┘ │    │
│  └──────┬────────────────────────────────────────────┬──┘    │
│         │                                            │        │
│  ┌──────▼──────┐                            ┌────────▼──────┐│
│  │ Data Layer  │                            │ Server Actions││
│  │ Adapter     │                            │ & Validation  ││
│  │ Pattern     │                            └────────┬──────┘│
│  └─────────────┘                                     │       │
└─────────────────────────────────────────────────────┼───────┘
                                                      │
                            ┌─────────────────────────┘
                            │ (Phase 3+)
                    ┌───────▼─────────┐
                    │ Firebase        │
                    │ Firestore       │
                    │ + Emulator      │
                    └─────────────────┘
```

### Structure des dossiers

```
gpparts/
├── app/                          # App Router Next.js 14
│   ├── (storefront)/            # Routes publiques
│   │   ├── page.tsx             # Accueil
│   │   ├── catalogue/           # Catalogue + filtres
│   │   ├── panier/              # Panier persisté (localStorage)
│   │   └── checkout/            # Formulaire commande
│   ├── admin/                   # Back-office protégé
│   │   └── middleware.ts        # Auth + rate limiting
│   ├── api/                     # Endpoints API (migrations futures)
│   └── layout.tsx               # Layout racine
├── components/                  # Composants React
│   ├── storefront/              # Composants boutique
│   │   ├── ProductCard.tsx
│   │   ├── CatalogueFilters.tsx
│   │   ├── Cart.tsx
│   │   └── CheckoutForm.tsx
│   ├── admin/                   # Composants back-office
│   ├── common/                  # Composants partagés
│   │   ├── Button.tsx           # Polymorphe (a, button, Link)
│   │   ├── ButtonLink.tsx
│   │   └── Header.tsx
│   └── ui/                      # Primitives Tailwind
├── lib/
│   ├── data/                    # Couche données (adapter pattern)
│   │   ├── types.ts             # Interface DataAdapter
│   │   ├── static.ts            # StaticAdapter (Phase 0-2)
│   │   ├── firebase.ts          # FirebaseAdapter (Phase 3+)
│   │   └── index.ts             # getAdapter() singleton
│   ├── utils/                   # Utilitaires
│   │   ├── prices.ts            # Calculs TVA, centimes
│   │   ├── orders.ts            # Génération ID commande
│   │   └── validation.ts        # Validation checkout
│   ├── constants/               # Constantes métier
│   │   ├── design.ts            # Palettes, typos
│   │   └── orders.ts            # Statuts, règles
│   └── middleware.ts            # Auth + rate limiting admin
├── tests/                       # Tests
│   ├── unit/                    # Tests unitaires (Vitest)
│   ├── e2e/                     # Tests E2E (Playwright)
│   ├── fixtures/                # Données partagées
│   │   └── index.ts             # Mock products, orders
│   ├── setup.ts                 # jest-dom + cleanup
│   └── vitest.config.ts
├── public/                      # Assets statiques
├── design/                      # Design & docs
│   ├── tokens.json              # Design tokens
│   └── docs/
│       └── GP_Parts_Architecture.md  # Ce fichier
├── .github/workflows/           # CI/CD
│   └── ci.yml                   # 7 jobs (lint, test, E2E, build)
├── .husky/                      # Pre-commit hooks
├── TECH_DEBT.md                 # Scoring dette technique
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 2. Design Systems

### 2.1 Storefront — "Volcanic Clarity v1.2"

Palette brute, énergique, inspirée par les volcans de la Guadeloupe.

| Rôle       | Couleur      | Hex                            | Utilisation                        |
| ---------- | ------------ | ------------------------------ | ---------------------------------- |
| Primary    | Volcanic Red | `#D64545`                      | CTA, accents, surbrillance produit |
| Secondary  | Basalt Black | `#1A1A1A`                      | Texte principal, contours          |
| Background | Cream        | `#F5F1E8`                      | Fond pages                         |
| Surface    | Ivory        | `#FFFBF7`                      | Cartes produits, containers        |
| Text muted | Lin          | `#8B8680`                      | Descriptions secondaires           |
| Success    | `#2D7A4A`    | Stock disponible, confirmation |
| Warning    | `#E8A844`    | Stock limité, alerte           |
| Danger     | `#D64545`    | Erreur, état désactivé         |

**Typographie**

- Titres H1–H3 : Big Shoulders Display (Google Fonts)
- Body : Instrument Sans (Google Fonts)
- Code/Price : JetBrains Mono (Google Fonts)

**Règle d'or** : Ne JAMAIS mixer avec la palette back-office. Les deux designs sont incompatibles.

### 2.2 Back-office — "iOS Clarity"

Palette épurée, accessible, inspirée par iOS Human Interface Guidelines.

| Composant        | Couleur   | Hex |
| ---------------- | --------- | --- |
| Blue (primary)   | `#007AFF` |
| Green (success)  | `#34C759` |
| Red (danger)     | `#FF3B30` |
| Orange (warning) | `#FF9500` |
| Yellow           | `#FFCC00` |
| Purple           | `#AF52DE` |
| Background       | `#F9F9F9` |
| Surface          | `#FFFFFF` |
| Text primary     | `#000000` |
| Text secondary   | `#8E8E93` |

**Typographie**

- Tout : Inter (Google Fonts)
- Cohérent avec expectations macOS/iOS

**Accès**

- Route : `/admin` (protégée middleware basic auth)
- Var d'env : `ADMIN_USERNAME`, `ADMIN_PASSWORD` (obligatoires, pas de fallback)
- Rate limiting : 5 tentatives / 15 min par IP (in-memory, Phase 4 Redis Upstash)

---

## 3. Data Layer — Adapter Pattern

### 3.1 Abstraction et règles

**Principe** : Zéro dépendance directe du code métier sur la source de données.

```typescript
// lib/data/types.ts
export interface DataAdapter {
  // Produits
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByCategory(category: string): Promise<Product[]>;

  // Commandes (Phase 3+)
  createOrder(order: Order): Promise<string>; // Retourne ID
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
}
```

**Règle d'or** : Aucun composant ne doit faire `import { PRODUCTS } from '@/data/products'`.

### 3.2 Implémentations

#### Phase 0–2 : StaticAdapter

```typescript
// lib/data/static.ts
import { products } from './static/products.json';

export class StaticAdapter implements DataAdapter {
  async getProducts() {
    return products;
  }
  async getProductById(id) {
    return products.find((p) => p.id === id) || null;
  }
  // ...
}
```

**Source** : `/lib/data/static/products.json` (140+ produits Guadeloupe).

#### Phase 3 : FirebaseAdapter (Émulateur dev)

```typescript
// lib/data/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export class FirebaseAdapter implements DataAdapter {
  private db = getFirestore();

  async getProducts() {
    const snap = await getDocs(collection(this.db, 'products'));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
  // ...
}
```

#### Phase 4 : Firebase Cloud

- Upgrade automatique depuis émulateur (swap config)
- Firestore Security Rules (lecture publique, écriture admin)
- Import seed depuis export Phase 3

### 3.3 Singleton

```typescript
// lib/data/index.ts
let adapter: DataAdapter;

export function getAdapter(): DataAdapter {
  if (!adapter) {
    const useFirebase = process.env.USE_FIREBASE === 'true';
    adapter = useFirebase ? new FirebaseAdapter() : new StaticAdapter();
  }
  return adapter;
}

// Usage partout
const products = await getAdapter().getProducts();
```

---

## 4. Sécurité — Audit 2026-04-06

### 4.1 HTTP Headers (CSP strict)

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self'; style-src 'self' 'nonce-{random}'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=(), payment=()',
  },
];
```

### 4.2 Admin Auth Middleware

```typescript
// app/admin/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_MAP = new Map<string, { count: number; timestamp: number }>();

export async function middleware(req: NextRequest) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const limit = RATE_LIMIT_MAP.get(ip) || { count: 0, timestamp: now };

  // Reset après 15 min
  if (now - limit.timestamp > 15 * 60 * 1000) {
    limit.count = 0;
    limit.timestamp = now;
  }

  // 5 tentatives max
  if (limit.count >= 5) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  // Vérifier credentials
  const auth = req.headers.get('authorization');
  const [username, password] = auth ? atob(auth.split(' ')[1]).split(':') : [];

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 503 });
  }

  if (username !== adminUsername || password !== adminPassword) {
    limit.count++;
    RATE_LIMIT_MAP.set(ip, limit);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // OK
  limit.count = 0;
  RATE_LIMIT_MAP.set(ip, limit);
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Var d'env obligatoires** (pas de fallback)

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Si absent → erreur 503.

### 4.3 Validation Serveur (Checkout)

```typescript
// lib/utils/validation.ts
import { z } from 'zod';

export const checkoutSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(2).max(100),
  address: z.string().min(10).max(500),
  zipCode: z.string().regex(/^\d{5}$/),
  city: z.string().max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{10,}$/)
    .max(20),
});

// app/actions/checkout.ts (Server Action)
('use server');

import { validateCheckout } from '@/lib/utils/validation';

export async function submitCheckout(formData: unknown) {
  const result = validateCheckout.safeParse(formData);

  if (!result.success) {
    return { error: 'Validation failed', issues: result.error.issues };
  }

  // Création commande, appel Stripe Phase 6, etc.
  const orderId = generateOrderId();
  return { success: true, orderId };
}
```

**Server Action**: Validation **indépendante du JS client**. Le navigateur ne peut pas contourner.

### 4.4 Autres mesures

| Domaine       | Mesure                                             | Statut |
| ------------- | -------------------------------------------------- | ------ |
| XSS/Injection | ESLint security plugin activé                      | ✅     |
| HTML nesting  | Composant Button polymorphe (pas de `<a><button>`) | ✅     |
| Inputs        | `maxLength` sur tous champs checkout               | ✅     |
| PII (Email)   | Sauvegardé en sessionStorage (pas localStorage)    | ✅     |
| npm audit     | CI job npm audit --audit-level=critical            | ✅     |
| Headers CSP   | Sans `unsafe-eval`, sans `unsafe-inline`           | ✅     |

---

## 5. Tests & Qualité

### 5.1 Pyramide de tests

```
        ▲
       ╱ ╲
      ╱ E2E ╲          Playwright (13 specs)
     ╱───────╲         5 scenarios critiques
    ╱         ╲
   ╱──────────╲        React Testing Library
  ╱ Composants ╲       31 tests
 ╱──────────────╲
╱─────────────────╲    Vitest + happy-dom
  Unit Tests      \    44 tests (lib/ + composants)
                   \
```

### 5.2 Chiffres (Phase 2 — 2026-04-06)

| Catégorie              | Count  | Status                 |
| ---------------------- | ------ | ---------------------- |
| Unit tests (Vitest)    | 44     | ✅                     |
| Component tests (RTL)  | 31     | ✅                     |
| E2E tests (Playwright) | 13     | ✅                     |
| **Total**              | **88** | **✅**                 |
| Coverage (lines)       | 68%    | ✅ (seuil 60%)         |
| Coverage (functions)   | 71%    | ✅ (seuil 60%)         |
| Coverage (branches)    | 55%    | ⚠️ (seuil 50%, limite) |

### 5.3 Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom', // NOT jsdom — Node 24 compat
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 60, // Seuil minimum
      functions: 60,
      branches: 50,
    },
  },
});
```

### 5.4 Fixtures partagées

```typescript
// tests/fixtures/index.ts
export const mockProducts = [
  {
    id: 'prod-1',
    name: 'Plaquettes de frein',
    price: 4500, // 45,00 €
    category: 'freinage',
    description: 'OEM Guadeloupe',
  },
  // ...
];

export const mockOrder = {
  id: 'GP-1712345678-AB12',
  email: 'test@example.com',
  fullName: 'Test User',
  // ...
};
```

### 5.5 Spécifications E2E (Playwright)

1. **Home** : Load accueil, vérifier hero + 3 catégories
2. **Catalogue filters** : Filtrer par catégorie, vérifier URL ↔ state sync
3. **Cart persist** : Ajouter produit, reload page, panier persiste
4. **Checkout validation** : Form incomplète → erreur, complet → validation OK
5. **Admin login** : Credentials invalides → 401, valides → accès /admin

---

## 6. CI/CD Pipeline

### 6.1 Workflows GitHub Actions (`.github/workflows/ci.yml`)

Deux jobs en paralléle avec `concurrency: cancel-in-progress`.

**Job : Quality** (7 étapes)

```yaml
- name: npm ci
- name: npm audit --audit-level=critical
- name: npm run lint
- name: npm run format:check (Prettier)
- name: npm run typecheck
- name: npm run test:unit (Vitest)
- name: npm run build (Next.js)
```

**Job : E2E** (séquentiel)

```yaml
- name: npm ci
- name: npm run build (prod)
- name: npm start (prod server)
- name: npx playwright test
```

### 6.2 Pre-commit Hooks (Husky + lint-staged)

```bash
# .husky/pre-commit
npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 6.3 Branch Protection (main)

- Exiger que `ci.yml` passe
- Exiger review avant merge
- Automergeable sur squash + cleanup

---

## 7. Patterns Anti-bugs — 3 Bugs Corrigés

### Bug #1 : Nesting HTML invalide `<a><button>`

**Problème** : Certains composants imbriquaient `<button>` dans `<a>`, violation HTML5.
**Solution** : Composant **Button polymorphe** avec prop `as`.

```typescript
// components/common/Button.tsx
import Link from 'next/link';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: 'button' | 'a' | 'link';
  href?: string;
};

export function Button({ as = 'button', href, children, ...props }: ButtonProps) {
  if (as === 'link' && href) {
    return <Link href={href} className="...btn">{children}</Link>;
  }
  if (as === 'a' && href) {
    return <a href={href} className="...btn">{children}</a>;
  }
  return <button className="...btn" {...props}>{children}</button>;
}
```

### Bug #2 : Désync URL ↔ state catalogue

**Problème** : Filtres catalogue ne sync pas avec `?category=X` lors de reload.
**Solution** : `useRef internalChange` + `useSearchParams` pour eviter re-render infini.

```typescript
// components/storefront/CatalogueFilters.tsx
import { useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function CatalogueFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const internalChange = useRef(false);

  const handleFilterChange = (category: string) => {
    internalChange.current = true;
    router.push(`?category=${category}`);
  };

  useEffect(() => {
    if (internalChange.current) {
      internalChange.current = false;
      return;
    }
    // Sync depuis URL (reload case)
    setSelectedCategory(searchParams.get('category') || 'tous');
  }, [searchParams]);

  return (/* ... */);
}
```

### Bug #3 : Race condition checkout

**Problème** : Utilisateur clique "Valider" 2x → commande dupliquée avant `clearCart()`.
**Solution** : Flag `orderPlaced` **avant** `clearCart()`.

```typescript
// components/storefront/CheckoutForm.tsx
const [orderPlaced, setOrderPlaced] = useState(false);

const handleSubmit = async (data: CheckoutData) => {
  if (orderPlaced) return; // Prevent race condition

  setOrderPlaced(true); // SET FIRST

  try {
    const result = await submitCheckout(data);
    if (result.success) {
      clearCart(); // AFTER flag
      router.push(`/commande/${result.orderId}`);
    }
  } catch (error) {
    setOrderPlaced(false);
  }
};
```

---

## 8. Conventions de Code

### Monnaie et calculs

- **Stockage** : Centimes (4500 = 45,00 €)
- **Affichage** : `(price / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })`
- **TVA** : 8,5% Guadeloupe
- **Fonction helper** :

```typescript
// lib/utils/prices.ts
export function centsToEuro(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
}

export function applyVAT(priceExcl: number): number {
  return Math.round(priceExcl * 1.085);
}
```

### LocalStorage & SessionStorage

- **Prefix** : Tous les keys `gpparts-*` (namespace)
- **Cart** : `gpparts-cart` (localStorage, persist)
- **Email** : `gpparts-email` (sessionStorage, PII protection)

```typescript
// lib/utils/storage.ts
export function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}
```

### ID Commande

Format : `GP-<timestamp36>-<rand4>`

- Exemple : `GP-1712354678-AB9F`
- Unique, human-readable, sort-safe

```typescript
// lib/utils/orders.ts
export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GP-${ts}-${rand}`;
}
```

### Images

- **Obligation** : `next/image` (jamais `<img>`)
- Lazy loading, optimisation serveur automatique

```typescript
import Image from 'next/image';

<Image
  src="/products/plaquettes.jpg"
  alt="Plaquettes de frein OEM"
  width={300}
  height={300}
  priority={false}
/>
```

### Navigation interne

- **Obligation** : `next/link` (jamais `<a href="/...">`)
- Prefetch automatique, instant navigation

```typescript
import Link from 'next/link';

<Link href="/catalogue?category=moteur">
  Moteurs
</Link>
```

### Locale & Date

- `fr-FR` (Guadeloupe)
- Dates au format ISO 8601 en base (2026-04-06T14:30:00Z)

---

## 9. Scoring Dette Technique

**Formule** : `Score = (Impact + Risk) × (6 − Effort)`

**Seuils de priorité**

- `>= 30` : CRITIQUE (corriger immédiatement)
- `15–29` : IMPORTANT (sprints court terme)
- `< 15` : BACKLOG (quand capacité dispo)

**Exemple calcul**

- Impact 3, Risk 3, Effort 2 → `(3 + 3) × (6 − 2) = 6 × 4 = 24` (IMPORTANT)

**Items actuels** → Voir `TECH_DEBT.md` à la racine du projet.

---

## 10. Roadmap Infra-first

### Phase 0 — Socle de dev ✅

**Fait en 2026-04-05**

- GitHub (privé) + Vercel Hobby + preview deploys par branche
- **DoD** : URL preview automatique sur chaque PR

### Phase 1 — CI Qualité ✅

**Fait en 2026-04-05**

- Lint, typecheck, build en CI
- Branch protection main (impossible merger build cassé)
- **DoD** : Tous les PRs validés, aucune merge sans CI verte

### Phase 2 — Tests & Audit Qualité ✅

**Fait en 2026-04-06**

- Vitest 1.6 + happy-dom + React Testing Library
- Playwright E2E (5 specs critiques)
- **88 tests** unitaires + composants + E2E, tous verts
- **Audit 4 axes** (perf, A11y, best practice, SEO) : 12 items critiques/importants corrigés
- **Audit sécurité** : 6 fixes appliqués (CSP, headers, auth, validation, rate limiting, XSS)
- ESLint security plugin + Prettier + Husky pre-commit
- Data layer abstraction (adapter pattern)
- Admin auth middleware + rate limiting
- Server Action validation checkout
- Skill `code-quality` créée + tâche audit planifiée
- **DoD** : CI 7 steps, 75+ tests ✅, 0 item critique ouvert, TECH_DEBT.md loggé

### Phase 3 — Firebase Émulateur ⏳

**Prochaine**

- Firebase Emulator Suite setup (dev machine)
- Seed script : import 140+ produits depuis static JSON
- Refactor data layer vers émulateur en dev
- Tests CI toujours contre émulateur
- **DoD** : Tous tests Phase 2 passent, données viennent émulateur, CI verte

### Phase 4 — Firebase Cloud Spark + Auth ⏳

**Prérequis produit** : P1 (30–50 références héros) + P5 (photos)

- Créer projet Firebase (Spark = gratuit, même limites)
- Firestore Security Rules (lecture publique produits, écriture admin)
- Import seed Phase 3 vers production
- Firebase Auth (1 compte admin)
- **DoD** : Prod utilise Firestore cloud, tests CI toujours contre émulateur

### Phase 5 — Back-office en écriture ⏳

**Prérequis** : Firestore cloud (Phase 4)

- CRUD produits (créer, modifier, supprimer, stock)
- Gestion stock + mutations commandes
- 6 statuts commande (confirmée, en préparation, expédiée, livrée, annulée, retour)
- Server Actions protégées par auth middleware
- **DoD** : Admin peut modifier stock en temps réel, statut commande sync

### Phase 6 — Commandes Persistées + Stripe + Emails ⏳

**Prérequis produit** : P2 (logistique) + P3 (Stripe account)

- Commandes sauvegardées Firestore (migration du localStorage)
- Stripe Checkout (mode test en dev, prod en production)
- Emails Resend (confirmation + expédition)
- Webhooks Stripe → webhook receiver (Vercel Functions Phase 4+)
- **DoD** : Paiement réel → commande persistée → email confirmation arrives

### Phase 7+ — Quand justifié ⏳

- Search Algolia (50+ refs)
- SEO (sitemap, robots.txt, metadata)
- Domaine custom (acheté + DNS)
- Plans payants (accès wholesale, B2B)

---

## 11. Diagramme de Dépendances Phases

```
Phases (infra-first) :

Phase 0   Phase 1   Phase 2   Phase 3    Phase 4         Phase 5      Phase 6
┌────────┬────────┬────────┬────────┬─────────────┬──────────────┬────────────┐
│ Socle  │ CI     │ Tests  │ Émul.  │ Cloud +Auth │ Back-office  │ Stripe+Mail│
│        │Qualité │ Audit  │        │             │ CRUD         │            │
└────────┴────────┴────────┴────────┴─────────────┴──────────────┴────────────┘
                                       ▲
                                       │ Require P1 (30-50 refs)
                                       │ + P5 (photos)
                                       │
           Indépendant de produit ←─────────────── Dépend de produit
```

**Key insight** : Phases 0–3 sont pures **infra**, zero dépendance métier. À partir Phase 4, la roadmap produit (P1, P2, P3, P5) devient bloquante.

---

## 12. Résumé État du Projet (2026-04-06)

| Axe             | Statut        | Détails                                        |
| --------------- | ------------- | ---------------------------------------------- |
| **Code**        | ✅ Stable     | TS strict, ESLint security, Prettier           |
| **Tests**       | ✅ Complets   | 88 tests (pyramide), happy-dom, Playwright     |
| **Sécurité**    | ✅ Auditée    | CSP, auth, rate limit, validation serveur, PII |
| **Data**        | ✅ Abstraite  | Adapter pattern, prêt Phase 3 Firebase         |
| **Design**      | ✅ Validé     | Deux palettes (storefront + admin), typos      |
| **Déploiement** | ✅ Automatisé | Vercel + GitHub Actions + preview deploys      |
| **Infra**       | ✅ Phase 2    | Prêt Phase 3 Émulateur                         |
| **Debt**        | 📋 Loggée     | TECH_DEBT.md, scoring appliqué                 |

**Prochaine étape** : Lancer Phase 3 — setup Firebase Emulator Suite.

---

**Document maintenu par** : Équipe Dev GP Parts
**Dernière révision** : 2026-04-06
**Prochaine révision** : Après Phase 3 (Émulateur)
