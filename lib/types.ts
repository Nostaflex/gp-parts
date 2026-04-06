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
