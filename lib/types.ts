// GP Parts — Types TypeScript
// Convention : tous les prix sont en centimes (entier). 6500 = 65,00 €

export type VehicleType = 'auto' | 'moto';

export type ProductCategory =
  | 'freinage'
  | 'moteur'
  | 'transmission'
  | 'eclairage'
  | 'filtres'
  | 'suspension'
  | 'electronique'
  | 'refroidissement';

export interface VehicleCompatibility {
  brand: string; // "Peugeot", "Renault", "Yamaha"
  model: string; // "208", "Clio IV", "MT-07"
  yearFrom: number; // 2015
  yearTo?: number; // 2021 (undefined = toujours en production)
}

export type StockType = 'local' | 'precommande';

export interface Product {
  id: string;
  slug: string;
  name: string;
  reference: string; // Référence constructeur, ex: "REN-CLO4-DBF-001"
  description: string;
  shortDescription: string; // Pour les cartes catalogue
  price: number; // EN CENTIMES
  priceOriginal?: number; // Prix avant promo (centimes)
  images: string[];
  category: ProductCategory;
  vehicleType: VehicleType;
  compatibility: VehicleCompatibility[];
  stock: number; // 0 = rupture, <5 = stock bas

  // v2 — Modèle hybride Scénario B (stock héros + précommande)
  // Activer ces champs quand le catalogue héros P1 est prêt.
  // stockType?: StockType;       // 'local' = en stock Guadeloupe, 'precommande' = 8-15j
  // deliveryDays?: number;       // Jours ouvrés estimés (précommande uniquement)

  isPromoted: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO — optimistic lock + tri admin (Phase 5)
  deletedAt: string | null; // ISO si soft-deleted, null si actif — TOUJOURS présent (Phase 5)
}

export interface CartItem {
  id: string; // = product.id (pas de variantes sur pièces détachées)
  productId: string;
  slug: string; // Pour lier vers /catalogue/[slug] depuis le panier
  name: string;
  reference: string;
  price: number; // Centimes
  quantity: number;
  image: string;
  stock: number; // Stock max pour limiter la quantité
}

export interface DeliveryOption {
  id: 'store-pickup' | 'island-delivery';
  label: string;
  description: string;
  priceInCents: number;
  estimatedDelay: string;
}

export interface OrderInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryOption: DeliveryOption['id'];
  acceptsCgv: boolean;
  acceptsMarketing: boolean;
}

// --- Commandes ---

export type OrderStatus =
  | 'nouvelle'
  | 'confirmee'
  | 'preparation'
  | 'expediee'
  | 'livree'
  | 'annulee';

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface OrderDelivery {
  option: DeliveryOption['id'];
  address: string;
  city: string;
  postalCode: string;
  priceInCents: number;
}

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  reference: string;
  priceInCents: number;
  quantity: number;
  image: string;
}

// Paiement (Phase 6). `status` (OrderStatus) reste le cycle logistique ;
// `paymentStatus` est orthogonal (état du paiement). Optionnels : les
// commandes legacy écrites avant Phase 6 ne portent pas ces champs.
export type PaymentMethod = 'card' | 'on_site';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: OrderCustomer;
  delivery: OrderDelivery;
  items: OrderItem[];
  subtotalInCents: number;
  totalInCents: number;
  acceptsMarketing: boolean;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Demandes CRM (Admin CMS v3 — Phase 3+) ---
// Créées publiquement via le formulaire de contact, traitées en back-office.
// PII client : jamais loggée dans audit_log (cf. lib/admin/audit.ts).

export type DemandeType =
  | 'contact'
  | 'vehicule'
  | 'moto'
  | 'piece'
  | 'financement'
  | 'reparation'
  | 'lavage'
  | 'location'; // devis longue durée (funnel v2)

export type DemandeStatus = 'nouvelle' | 'en_cours' | 'traitee' | 'deleted';

export interface Demande {
  id: string;
  type: DemandeType;
  status: DemandeStatus;
  nom: string;
  email: string;
  telephone: string;
  message: string;
  // Référence optionnelle vers la ressource concernée (id véhicule/moto/produit)
  resourceRef?: string;
  // Notes internes ajoutées par l'admin (jamais exposées côté public)
  notes?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  expiresAt: number; // unix ms — TTL Firestore native (purge RGPD)
}
