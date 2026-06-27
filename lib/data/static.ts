import type { Product, Order, OrderStatus, PaymentStatus, Demande } from '@/lib/types';
import { PRODUCTS } from '@/lib/products';
import { VEHICULES } from '@/lib/vehicules';
import { MOTOS } from '@/lib/motos';
import { LOCATION_CARS } from '@/lib/location-cars';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';
import type { LocationCar } from '@/lib/location-cars';
import type { DataAdapter, ProductFilters, OrderFilters, DemandeFilters } from './types';
import type { Reservation, ReservationStatus } from '@/lib/reservations';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';
import { applyClientFilters } from './filters';

// Fixtures CRM pour le dev local sans émulateur Firebase. En production,
// les demandes viennent exclusivement de Firestore (cf. garde NODE_ENV).
const DEMANDES_FIXTURES: Demande[] = [
  {
    id: 'dem-001',
    type: 'vehicule',
    status: 'nouvelle',
    nom: 'Jean Dupont',
    email: 'jean.dupont@example.gp',
    telephone: '0690112233',
    message: 'Bonjour, la Peugeot 308 SW est-elle toujours disponible ?',
    resourceRef: 'peugeot-308sw',
    createdAt: '2026-05-10T09:15:00.000Z',
    updatedAt: '2026-05-10T09:15:00.000Z',
    expiresAt: Date.parse('2027-05-10T09:15:00.000Z'),
  },
  {
    id: 'dem-002',
    type: 'piece',
    status: 'en_cours',
    nom: 'Marie Latour',
    email: 'marie.latour@example.gp',
    telephone: '0696445566',
    message: 'Avez-vous des plaquettes de frein pour Clio IV en stock ?',
    notes: 'Rappeler après 17h — devis envoyé le 12/05.',
    createdAt: '2026-05-12T14:30:00.000Z',
    updatedAt: '2026-05-13T08:00:00.000Z',
    expiresAt: Date.parse('2027-05-12T14:30:00.000Z'),
  },
  {
    id: 'dem-003',
    type: 'financement',
    status: 'traitee',
    nom: 'Carl Sévère',
    email: 'carl.severe@example.gp',
    telephone: '0690778899',
    message: 'Simulation de financement pour la Yamaha MT-07.',
    resourceRef: 'yamaha-mt07',
    notes: 'Dossier transmis au partenaire financier — clos.',
    createdAt: '2026-05-08T11:00:00.000Z',
    updatedAt: '2026-05-14T16:45:00.000Z',
    expiresAt: Date.parse('2027-05-08T11:00:00.000Z'),
  },
];

// Le fallback statique des données back-office est réservé au dev local.
// En production, vehicules/motos/demandes proviennent exclusivement de
// Firestore (cf. spec Admin CMS v3 Phase 3).
let _devFallbackWarned = false;
function warnDevFallback(method: string): void {
  if (process.env.NODE_ENV === 'production' && !_devFallbackWarned) {
    _devFallbackWarned = true;
    console.warn(
      `[StaticAdapter] ${method}() utilisé en production : fallback statique ` +
        `actif. Attendu uniquement si Firebase non configuré ` +
        `(NEXT_PUBLIC_FIREBASE_PROJECT_ID absent). En prod Vercel normale, ` +
        `FirebaseAdapter est utilisé. (warn émis une seule fois par process)`
    );
  }
}

/**
 * StaticAdapter — Implements DataAdapter using in-memory PRODUCTS array
 * This serves as the default adapter before migrating to Firestore.
 * Wraps existing helper functions (getProductBySlug, etc.) in async functions.
 */
// In-memory store pour les tests et le mode statique
const ORDERS_STORE: Order[] = [];
let orderIdCounter = 1;

const RESERVATIONS_STORE: Reservation[] = [];
let reservationIdCounter = 1;

export class StaticAdapter implements DataAdapter {
  /**
   * Get all products, optionally filtered by various criteria
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    // Exclut les produits soft-deleted par défaut (Phase 5 §9.16)
    const list = filters?.includeDeleted
      ? [...PRODUCTS]
      : PRODUCTS.filter((p) => p.deletedAt === null);
    return applyClientFilters(list, filters);
  }

  /**
   * Get a single product by its slug
   */
  async getProductBySlug(
    slug: string,
    opts?: { includeDeleted?: boolean }
  ): Promise<Product | null> {
    const product = PRODUCTS.find((p) => p.slug === slug) ?? null;
    if (product?.deletedAt && !opts?.includeDeleted) return null;
    return product;
  }

  /**
   * Get a single product by its ID
   */
  async getProductById(id: string, opts?: { includeDeleted?: boolean }): Promise<Product | null> {
    const product = PRODUCTS.find((p) => p.id === id) ?? null;
    if (product?.deletedAt && !opts?.includeDeleted) return null;
    return product;
  }

  /**
   * Get all products in a specific category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.deletedAt === null && p.category === category);
  }

  /**
   * Get all products marked as promoted
   */
  async getPromotedProducts(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.deletedAt === null && p.isPromoted);
  }

  /**
   * Get featured products (in stock, limited by count)
   */
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.deletedAt === null && p.stock > 0).slice(0, limit);
  }

  /**
   * Get all unique product categories
   */
  async getCategories(): Promise<string[]> {
    const categories = new Set(PRODUCTS.filter((p) => p.deletedAt === null).map((p) => p.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all unique brands from product compatibility data
   */
  async getBrands(): Promise<string[]> {
    const brands = new Set<string>();
    PRODUCTS.filter((p) => p.deletedAt === null).forEach((p) => {
      p.compatibility.forEach((compat) => {
        brands.add(compat.brand);
      });
    });
    return Array.from(brands).sort();
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    const id = `static-order-${orderIdCounter++}`;
    ORDERS_STORE.push({ ...order, id });
    return id;
  }

  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    let orders = [...ORDERS_STORE].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filters?.status) orders = orders.filter((o) => o.status === filters.status);
    if (filters?.limit) orders = orders.slice(0, filters.limit);
    return orders;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return ORDERS_STORE.find((o) => o.id === id) ?? null;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const order = ORDERS_STORE.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
    }
  }

  async updateOrderPayment(
    id: string,
    patch: { paymentStatus: PaymentStatus; stripePaymentIntentId?: string }
  ): Promise<void> {
    const order = ORDERS_STORE.find((o) => o.id === id);
    if (order) {
      order.paymentStatus = patch.paymentStatus;
      if (patch.stripePaymentIntentId) order.stripePaymentIntentId = patch.stripePaymentIntentId;
      order.updatedAt = new Date().toISOString();
    }
  }

  // ─── Admin CMS v3 — Phase 3 (lecture seule, dev fallback) ──────────

  async getVehicules(): Promise<Vehicule[]> {
    warnDevFallback('getVehicules');
    return [...VEHICULES];
  }

  async getMotos(): Promise<Moto[]> {
    warnDevFallback('getMotos');
    return [...MOTOS];
  }

  async getLocationCars(): Promise<LocationCar[]> {
    warnDevFallback('getLocationCars');
    return [...LOCATION_CARS];
  }

  async getLocationCarById(id: string): Promise<LocationCar | null> {
    warnDevFallback('getLocationCarById');
    return LOCATION_CARS.find((c) => c.id === id) ?? null;
  }

  async createReservation(data: Omit<Reservation, 'id'>): Promise<string> {
    const id = `static-reservation-${reservationIdCounter++}`;
    RESERVATIONS_STORE.push({ ...data, id });
    return id;
  }

  async getReservations(filters?: {
    status?: ReservationStatus;
    limit?: number;
  }): Promise<Reservation[]> {
    let res = [...RESERVATIONS_STORE].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filters?.status) res = res.filter((r) => r.status === filters.status);
    if (filters?.limit) res = res.slice(0, filters.limit);
    return res;
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    return RESERVATIONS_STORE.find((r) => r.id === id) ?? null;
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
    const r = RESERVATIONS_STORE.find((x) => x.id === id);
    if (r) {
      r.status = status;
      r.updatedAt = new Date().toISOString();
    }
  }

  async getDemandes(filters?: DemandeFilters): Promise<Demande[]> {
    warnDevFallback('getDemandes');
    let demandes = [...DEMANDES_FIXTURES].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filters?.status) demandes = demandes.filter((d) => d.status === filters.status);
    if (filters?.type) demandes = demandes.filter((d) => d.type === filters.type);
    if (filters?.limit) demandes = demandes.slice(0, filters.limit);
    return demandes;
  }

  async getFeatureFlags(): Promise<FeatureFlags> {
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  async getContactInfo(): Promise<ContactInfo> {
    return { ...DEFAULT_CONTACT_INFO };
  }
}
