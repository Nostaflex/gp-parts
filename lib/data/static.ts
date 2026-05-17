import type { Product, Order, OrderStatus, Demande } from '@/lib/types';
import { PRODUCTS } from '@/lib/products';
import { VEHICULES } from '@/lib/vehicules';
import { MOTOS } from '@/lib/motos';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';
import type { DataAdapter, ProductFilters, OrderFilters, DemandeFilters } from './types';
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
function warnDevFallback(method: string): void {
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      `[StaticAdapter] ${method}() utilisé en production : fallback statique ` +
        `actif. Attendu uniquement si Firebase non configuré ` +
        `(NEXT_PUBLIC_FIREBASE_PROJECT_ID absent). En prod Vercel normale, ` +
        `FirebaseAdapter est utilisé.`
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

export class StaticAdapter implements DataAdapter {
  /**
   * Get all products, optionally filtered by various criteria
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    return applyClientFilters([...PRODUCTS], filters);
  }

  /**
   * Get a single product by its slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = PRODUCTS.find((p) => p.slug === slug);
    return product || null;
  }

  /**
   * Get a single product by its ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const product = PRODUCTS.find((p) => p.id === id);
    return product || null;
  }

  /**
   * Get all products in a specific category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.category === category);
  }

  /**
   * Get all products marked as promoted
   */
  async getPromotedProducts(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.isPromoted);
  }

  /**
   * Get featured products (in stock, limited by count)
   */
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.stock > 0).slice(0, limit);
  }

  /**
   * Get all unique product categories
   */
  async getCategories(): Promise<string[]> {
    const categories = new Set(PRODUCTS.map((p) => p.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all unique brands from product compatibility data
   */
  async getBrands(): Promise<string[]> {
    const brands = new Set<string>();
    PRODUCTS.forEach((p) => {
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

  // ─── Admin CMS v3 — Phase 3 (lecture seule, dev fallback) ──────────

  async getVehicules(): Promise<Vehicule[]> {
    warnDevFallback('getVehicules');
    return [...VEHICULES];
  }

  async getMotos(): Promise<Moto[]> {
    warnDevFallback('getMotos');
    return [...MOTOS];
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
}
