# GP Parts — Boutique en ligne pièces détachées Guadeloupe

Tunnel de commande e-commerce complet pour la vente de pièces détachées auto et moto en Guadeloupe, avec back office de gestion du stock et des promotions.

**Version actuelle : MVP statique démo** — données en dur dans `lib/products.ts`, paiement simulé, aucune base de données. Le projet est prêt à être étendu avec Firebase (Firestore + Auth + Storage) pour la version production.

## Stack technique

- **Next.js 14.2** (App Router, Server Components)
- **React 18.3** + **TypeScript 5.4**
- **Tailwind CSS 3.4** avec design system "Volcanic Clarity v1.2"
- **Lucide React** pour les icônes
- **Google Fonts** : Big Shoulders Display (titres) · Instrument Sans (corps) · JetBrains Mono (références)

## Démarrage

```bash
cd gpparts
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Commandes disponibles :

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — serveur de production
- `npm run lint` — lint ESLint

## Structure du projet

```
gpparts/
├── app/
│   ├── layout.tsx                      # Layout racine (Navbar, Footer, CartProvider, CookieBanner)
│   ├── page.tsx                        # Page d'accueil
│   ├── globals.css
│   ├── catalogue/
│   │   ├── page.tsx                    # Liste avec filtres (type, catégorie, recherche)
│   │   └── [slug]/
│   │       ├── page.tsx                # Fiche produit (server component + JSON-LD)
│   │       └── AddToCartButton.tsx     # Client component ajout panier
│   ├── panier/page.tsx                 # Panier
│   ├── commande/
│   │   ├── page.tsx                    # Checkout (formulaire + validation)
│   │   └── confirmation/page.tsx       # Confirmation après commande
│   ├── admin/page.tsx                  # Back office — KPI + table produits
│   ├── mentions-legales/page.tsx
│   ├── cgv/page.tsx
│   ├── confidentialite/page.tsx
│   └── cookies/page.tsx
├── components/
│   ├── ui/                             # Button, Input, Badge
│   ├── layout/                         # Navbar (pill flottante), Footer
│   ├── cart/                           # CartProvider (Context), CartItemRow
│   ├── products/ProductCard.tsx
│   └── gdpr/CookieBanner.tsx           # Bannière consentement 3 catégories
├── lib/
│   ├── types.ts                        # Product, CartItem, OrderInfo, VehicleType...
│   ├── utils.ts                        # formatPrice, slugify, generateOrderNumber, cn, getStock*
│   ├── products.ts                     # 10 produits de démo
│   └── categories.ts                   # 8 catégories
├── tailwind.config.ts                  # Design system Volcanic Clarity v1.2
├── tsconfig.json
├── next.config.js
└── package.json
```

## Design system — Volcanic Clarity v1.2

Palette inspirée des volcans et des eaux caribéennes de la Guadeloupe.

| Token | Valeur | Usage |
|---|---|---|
| `cream` | `#F8F7F4` | Fond principal |
| `ivory` | `#F5F0EB` | Cartes, sections alternées |
| `lin` | `#E5DDD3` | Bordures, séparateurs |
| `volcanic` | `#FF4D00` | Accent principal, prix, CTA |
| `caribbean` | `#00B996` | Succès, stock dispo |
| `basalt` | `#12100E` | Texte, navigation |
| `error` | `#DC2626` | Erreurs |
| `warning` | `#D97706` | Stock faible, alertes |

**Règle WCAG importante** : le volcanic (#FF4D00) sur cream a un contraste de 3.7:1. Il doit donc être utilisé uniquement sur du texte ≥ 20px bold (`text-h4` minimum) pour respecter les critères "large text" de WCAG AA.

## Personnalisation rapide

### Modifier les produits

Éditer `lib/products.ts`. Exemple :

```typescript
p({
  name: 'Plaquettes de frein avant',
  brand: 'Peugeot',
  reference: 'PEU-208-BP-01',
  description: 'Plaquettes avant homologuées Peugeot 208.',
  price: 4500,          // TOUJOURS en centimes (4500 = 45,00 €)
  priceOriginal: 5500,  // optionnel — affiche un prix barré
  category: 'freinage',
  vehicleType: 'auto',
  compatibility: [{ brand: 'Peugeot', model: '208', yearFrom: 2012 }],
  stock: 12,
  isPromoted: true,
}),
```

**Règles importantes** :
- Les prix sont **toujours en centimes** (entiers) pour éviter les erreurs d'arrondi.
- `stock: 0` rend le produit indisponible à l'achat.
- `stock: 1-5` affiche "Stock faible" en orange.
- `isPromoted: true` fait apparaître le produit dans la section promotions et dans l'admin.

### Changer les couleurs

Éditer `tailwind.config.ts` → clé `theme.extend.colors`. Les classes Tailwind (`bg-volcanic`, `text-caribbean`, etc.) se mettent à jour automatiquement.

### Changer les polices

Éditer `app/layout.tsx` — les 3 polices sont chargées via `next/font/google`.

## Fonctionnalités implémentées

### Front (tunnel de commande)
- Page d'accueil avec hero, catégories, produits vedettes, promotions
- Catalogue avec filtres : type de véhicule (auto/moto), catégorie, recherche texte
- Fiche produit avec compatibilité véhicule, JSON-LD Schema.org
- Panier persisté dans localStorage (anti-hydratation via flag `isReady`)
- Checkout avec validation (email, téléphone, code postal Guadeloupe 971xx)
- Choix entre retrait en boutique (gratuit) et livraison Guadeloupe (5 €)
- Confirmation de commande avec numéro généré
- **Paiement simulé** — pas de collecte de carte bancaire

### Back office
- Tableau de bord avec KPIs (total produits, stock faible, promos, valeur stock)
- Alerte stock faible
- Table produits avec recherche et filtres
- (Lecture seule dans la version statique)

### RGPD & légal
- Bannière cookies avec 3 catégories (essentiels, analytiques, marketing)
- Consentement persisté en localStorage avec timestamp
- 4 pages légales (mentions, CGV, confidentialité, cookies)

## Prochaines étapes (production)

La version statique est un MVP de démonstration. Pour passer en production, les étapes prévues sont :

1. **Firebase Firestore** pour persistance produits, commandes, stock
2. **Firebase Auth** pour l'espace client et l'admin
3. **Firebase Storage** pour les vraies images produits
4. **Stripe** pour le paiement réel
5. **Algolia** pour la recherche instantanée
6. **Brevo / Mailjet** pour les emails transactionnels
7. **FCM** pour les notifications de commande

## Notes

- Les images sont des placeholders — remplacer par de vraies photos produits dans `public/images/` puis mettre à jour `products.ts`.
- Le code postal 971xx correspond à la Guadeloupe (97110–97190). La validation refuse les autres codes postaux.
- La livraison est limitée à la Guadeloupe (pas d'expédition hors département).

---

Mode démo — aucun paiement réel, aucune donnée persistée au-delà du localStorage du navigateur.
# retest
# retest
