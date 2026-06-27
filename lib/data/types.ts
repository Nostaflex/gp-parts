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
import type { LocationCar } from '@/lib/location-cars';
import type { Reservation, ReservationStatus } from '@/lib/reservations';
import type { FeatureFlags } from '@/lib/feature-flags';
import type { ContactInfo } from '@/lib/contact-info';

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
  getLocationCars(opts?: { includeDeleted?: boolean }): Promise<LocationCar[]>;
  getLocationCarById(id: string): Promise<LocationCar | null>;

  createReservation(data: Omit<Reservation, 'id'>): Promise<string>;
  getReservations(filters?: { status?: ReservationStatus; limit?: number }): Promise<Reservation[]>;
  getReservationById(id: string): Promise<Reservation | null>;
  updateReservationStatus(id: string, status: ReservationStatus): Promise<void>;

  // Feature flags de sections (visibilité storefront). Écriture via Server
  // Action toggleFeatureFlags (Admin SDK), pas via l'adapter.
  getFeatureFlags(): Promise<FeatureFlags>;

  // Coordonnées de contact (configurables au BO). Écriture via Server Action
  // updateContactInfo (Admin SDK).
  getContactInfo(): Promise<ContactInfo>;
}
