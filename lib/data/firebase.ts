import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Product,
  ProductCategory,
  Order,
  OrderStatus,
  PaymentStatus,
  Demande,
} from '@/lib/types';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';
import { parseProduct } from '@/lib/schemas/product';
import { parseOrder } from '@/lib/schemas/order';
import type { DataAdapter, ProductFilters, OrderFilters, DemandeFilters } from './types';
import { applyClientFilters } from './filters';

/**
 * FirebaseAdapter — Implements DataAdapter using Firestore.
 *
 * Phase 3 : pointe vers l'émulateur local (connectFirestoreEmulator dans lib/firebase.ts).
 * Phase 4 : même code, pointe vers Firestore cloud (juste changer les env vars).
 *
 * Les données Firestore utilisent la même structure que le type Product.
 * Le document ID dans Firestore = product.id.
 */
export class FirebaseAdapter implements DataAdapter {
  private readonly productsRef = collection(db, 'products');
  private readonly ordersRef = collection(db, 'orders');
  private readonly vehiculesRef = collection(db, 'vehicules');
  private readonly motosRef = collection(db, 'motos');
  private readonly demandesRef = collection(db, 'demandes');

  /**
   * Convertit un document Firestore en Product typé.
   * Utilise parseProduct() (Zod) pour valider les données à l'exécution
   * et attraper les corruptions Firestore.
   */
  private docToProduct(docSnap: { id: string; data: () => Record<string, unknown> }): Product {
    const data = docSnap.data();
    return parseProduct({ ...data, id: docSnap.id });
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    // Firestore supporte un seul champ d'inégalité par requête.
    // Pour les filtres complexes (search, minPrice + maxPrice + category),
    // on récupère côté client et on filtre en mémoire.
    // Acceptable pour < 200 produits. Phase 7+ : Algolia pour search avancé.

    // Phase 5 §9.16 : exclusion soft-deleted au niveau QUERY (pas post-fetch)
    // Tous les documents produit ont deletedAt présent (null ou ISO string).
    const deletedAtClause = !filters?.includeDeleted ? [where('deletedAt', '==', null)] : [];

    let products: Product[];
    const skipped = new Set<keyof ProductFilters>();

    if (filters?.category && !filters?.search && !filters?.minPrice && !filters?.maxPrice) {
      // Cas optimisé : filtre simple par catégorie (query Firestore)
      const q = query(
        this.productsRef,
        ...deletedAtClause,
        where('category', '==', filters.category)
      );
      const snapshot = await getDocs(q);
      products = snapshot.docs.map((d) => this.docToProduct(d));
      skipped.add('category');
    } else if (filters?.vehicleType && !filters?.search) {
      // Cas optimisé : filtre par type de véhicule
      const q = query(
        this.productsRef,
        ...deletedAtClause,
        where('vehicleType', '==', filters.vehicleType)
      );
      const snapshot = await getDocs(q);
      products = snapshot.docs.map((d) => this.docToProduct(d));
      skipped.add('vehicleType');
    } else {
      // Cas général : récupère tout (actifs seulement) et filtre en mémoire
      const q = query(this.productsRef, ...deletedAtClause);
      const snapshot = await getDocs(q);
      products = snapshot.docs.map((d) => this.docToProduct(d));
    }

    // Filtres client-side via la fonction partagée
    return applyClientFilters(products, filters, skipped);
  }

  async getProductBySlug(
    slug: string,
    opts?: { includeDeleted?: boolean }
  ): Promise<Product | null> {
    const q = query(this.productsRef, where('slug', '==', slug), firestoreLimit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const product = this.docToProduct(snapshot.docs[0]);
    // Phase 5 §9.17 : by-key null pour soft-deleted (sauf includeDeleted)
    if (product.deletedAt && !opts?.includeDeleted) return null;
    return product;
  }

  async getProductById(id: string, opts?: { includeDeleted?: boolean }): Promise<Product | null> {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const product = this.docToProduct(docSnap);
    // Phase 5 §9.17 : by-key null pour soft-deleted (sauf includeDeleted)
    if (product.deletedAt && !opts?.includeDeleted) return null;
    return product;
  }

  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    // Phase 5 §9.16 : exclut les soft-deleted au niveau query
    const q = query(
      this.productsRef,
      where('deletedAt', '==', null),
      where('category', '==', category)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.docToProduct(d));
  }

  async getPromotedProducts(): Promise<Product[]> {
    // Phase 5 §9.16 : exclut les soft-deleted au niveau query
    const q = query(
      this.productsRef,
      where('deletedAt', '==', null),
      where('isPromoted', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.docToProduct(d));
  }

  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    // Phase 5 §9.16 : exclut les soft-deleted au niveau query
    const q = query(
      this.productsRef,
      where('deletedAt', '==', null),
      where('stock', '>', 0),
      orderBy('stock', 'desc'),
      firestoreLimit(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.docToProduct(d));
  }

  async getCategories(): Promise<string[]> {
    // Pour un petit catalogue (< 200 produits), on récupère tous les produits actifs
    // et on extrait les catégories. Phase 4+ : utiliser un doc metadata/categories.
    // Phase 5 §9.16 : exclut les soft-deleted au niveau query
    const q = query(this.productsRef, where('deletedAt', '==', null));
    const snapshot = await getDocs(q);
    const categories = new Set(
      snapshot.docs.map((d) => parseProduct({ ...d.data(), id: d.id }).category)
    );
    return Array.from(categories).sort();
  }

  async getBrands(): Promise<string[]> {
    // Phase 5 §9.16 : exclut les soft-deleted au niveau query
    const q = query(this.productsRef, where('deletedAt', '==', null));
    const snapshot = await getDocs(q);
    const brands = new Set<string>();
    snapshot.docs.forEach((d) => {
      const product = parseProduct({ ...d.data(), id: d.id });
      product.compatibility.forEach((compat) => brands.add(compat.brand));
    });
    return Array.from(brands).sort();
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    const docRef = await addDoc(this.ordersRef, {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    let q = query(this.ordersRef, orderBy('createdAt', 'desc'));
    if (filters?.status) {
      q = query(
        this.ordersRef,
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    }
    if (filters?.limit) {
      q = query(q, firestoreLimit(filters.limit));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.docToOrder(d));
  }

  async getOrderById(id: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.docToOrder(docSnap);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
  }

  async updateOrderPayment(
    id: string,
    patch: { paymentStatus: PaymentStatus; stripePaymentIntentId?: string }
  ): Promise<void> {
    const docRef = doc(db, 'orders', id);
    const update: Record<string, unknown> = {
      paymentStatus: patch.paymentStatus,
      updatedAt: serverTimestamp(),
    };
    if (patch.stripePaymentIntentId) update.stripePaymentIntentId = patch.stripePaymentIntentId;
    await updateDoc(docRef, update);
  }

  private docToOrder(docSnap: { id: string; data: () => Record<string, unknown> }): Order {
    const data = docSnap.data();
    // Firestore Timestamps → ISO strings
    const toISO = (v: unknown) =>
      v instanceof Timestamp ? v.toDate().toISOString() : (v as string);
    return parseOrder({
      ...data,
      id: docSnap.id,
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    });
  }

  // ─── Admin CMS v3 — Phase 3 (lecture seule) ────────────────────────
  // Validation Zod des documents : Phase 4 (lib/schemas/vehicule|moto|
  // demande.ts). Ici, lecture brute typée — cohérent avec le découpage spec.

  async getVehicules(): Promise<Vehicule[]> {
    const snapshot = await getDocs(this.vehiculesRef);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Vehicule);
  }

  async getMotos(): Promise<Moto[]> {
    const snapshot = await getDocs(this.motosRef);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Moto);
  }

  async getDemandes(filters?: DemandeFilters): Promise<Demande[]> {
    let q = query(this.demandesRef, orderBy('createdAt', 'desc'));
    if (filters?.status) {
      q = query(
        this.demandesRef,
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    }
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.limit) {
      q = query(q, firestoreLimit(filters.limit));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Demande);
  }
}
