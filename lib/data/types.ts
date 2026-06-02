import type {
  Product,
  ProductCategory,
  Order,
  OrderStatus,
  PaymentStatus,
  Demande,
  DemandeStatus,
  DemandeType,
} from '@/lib/types';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

export interface ProductFilters {
  category?: ProductCategory;
  vehicleType?: 'auto' | 'moto';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  /** Si true, inclut les produits soft-deleted (deletedAt != null). Par défaut false. */
  includeDeleted?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus;
  limit?: number;
}

export interface DemandeFilters {
  status?: DemandeStatus;
  type?: DemandeType;
  limit?: number;
}

export interface DataAdapter {
  getProducts(filters?: ProductFilters): Promise<Product[]>;
  getProductBySlug(slug: string, opts?: { includeDeleted?: boolean }): Promise<Product | null>;
  getProductById(id: string, opts?: { includeDeleted?: boolean }): Promise<Product | null>;
  getProductsByCategory(category: ProductCategory): Promise<Product[]>;
  getPromotedProducts(): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getCategories(): Promise<string[]>;
  getBrands(): Promise<string[]>;

  createOrder(order: Omit<Order, 'id'>): Promise<string>;
  getOrders(filters?: OrderFilters): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
  // Paiement (Phase 6) — muté par le webhook Stripe. Orthogonal au statut
  // logistique (`updateOrderStatus`).
  updateOrderPayment(
    id: string,
    patch: { paymentStatus: PaymentStatus; stripePaymentIntentId?: string }
  ): Promise<void>;

  // Admin CMS v3 — Phase 3+. Lecture seule ici ; les mutations passent par
  // des Server Actions dédiées (requireAdmin + audit log).
  getVehicules(): Promise<Vehicule[]>;
  getMotos(): Promise<Moto[]>;
  getDemandes(filters?: DemandeFilters): Promise<Demande[]>;
}
