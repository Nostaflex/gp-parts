import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, ProductCategory } from '@/lib/types';
import type { DataAdapter, ProductFilters } from './types';

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

  /**
   * Convertit un document Firestore en Product typé.
   */
  private docToProduct(docSnap: { id: string; data: () => Record<string, unknown> }): Product {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      slug: data.slug as string,
      name: data.name as string,
      reference: data.reference as string,
      description: data.description as string,
      shortDescription: data.shortDescription as string,
      price: data.price as number,
      priceOriginal: data.priceOriginal as number | undefined,
      images: data.images as string[],
      category: data.category as ProductCategory,
      vehicleType: data.vehicleType as 'auto' | 'moto',
      compatibility: data.compatibility as Product['compatibility'],
      stock: data.stock as number,
      isPromoted: data.isPromoted as boolean,
      createdAt: data.createdAt as string,
    };
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    // Firestore supporte un seul champ d'inégalité par requête.
    // Pour les filtres complexes (search, minPrice + maxPrice + category),
    // on récupère côté client et on filtre en mémoire.
    // Acceptable pour < 200 produits. Phase 7+ : Algolia pour search avancé.

    let products: Product[];

    if (filters?.category && !filters?.search && !filters?.minPrice && !filters?.maxPrice) {
      // Cas optimisé : filtre simple par catégorie (query Firestore)
      const q = query(this.productsRef, where('category', '==', filters.category));
      const snapshot = await getDocs(q);
      products = snapshot.docs.map((d) => this.docToProduct(d));
    } else if (filters?.vehicleType && !filters?.search) {
      // Cas optimisé : filtre par type de véhicule
      const q = query(this.productsRef, where('vehicleType', '==', filters.vehicleType));
      const snapshot = await getDocs(q);
      products = snapshot.docs.map((d) => this.docToProduct(d));
    } else {
      // Cas général : récupère tout et filtre en mémoire
      const snapshot = await getDocs(this.productsRef);
      products = snapshot.docs.map((d) => this.docToProduct(d));
    }

    // Filtres client-side pour les cas non couverts par Firestore
    if (filters?.category && (filters?.search || filters?.minPrice || filters?.maxPrice)) {
      products = products.filter((p) => p.category === filters.category);
    }

    if (filters?.vehicleType && filters?.search) {
      products = products.filter((p) => p.vehicleType === filters.vehicleType);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }

    if (filters?.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters?.inStock) {
      products = products.filter((p) => p.stock > 0);
    }

    return products;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const q = query(this.productsRef, where('slug', '==', slug), firestoreLimit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.docToProduct(snapshot.docs[0]);
  }

  async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.docToProduct(docSnap);
  }

  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    const q = query(this.productsRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.docToProduct(d));
  }

  async getPromotedProducts(): Promise<Product[]> {
    const q = query(this.productsRef, where('isPromoted', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.docToProduct(d));
  }

  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    const q = query(
      this.productsRef,
      where('stock', '>', 0),
      orderBy('stock', 'desc'),
      firestoreLimit(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.docToProduct(d));
  }

  async getCategories(): Promise<string[]> {
    // Pour un petit catalogue (< 200 produits), on récupère tous les produits
    // et on extrait les catégories. Phase 4+ : utiliser un doc metadata/categories.
    const snapshot = await getDocs(this.productsRef);
    const categories = new Set(snapshot.docs.map((d) => d.data().category as string));
    return Array.from(categories).sort();
  }

  async getBrands(): Promise<string[]> {
    const snapshot = await getDocs(this.productsRef);
    const brands = new Set<string>();
    snapshot.docs.forEach((d) => {
      const data = d.data();
      const compatibility = data.compatibility as Product['compatibility'];
      compatibility?.forEach((compat) => brands.add(compat.brand));
    });
    return Array.from(brands).sort();
  }
}
