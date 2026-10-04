import { getAdminFirestore } from '@/lib/firebase-admin';
import { parseProduct } from '@/lib/schemas/product';
import { parseLocationCar } from '@/lib/schemas/location-car';

import type { Product } from '@/lib/types';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';
import type { LocationCar } from '@/lib/location-cars';

/**
 * Lecture admin du catalogue via l'Admin SDK, corbeille comprise. Les rules
 * réservent les éléments supprimés (`products`, `location-cars`) à isAdmin(),
 * or le SDK client n'a pas de session authentifiée côté serveur : la fiche
 * d'une pièce supprimée était refusée (permission-denied). Miroir de
 * orders-server. TOUJOURS appeler requireAdminPage() en amont. Le site public,
 * lui, passe par le DataAdapter, qui ne rend jamais un élément supprimé.
 */
type Lire<T> = (id: string, data: Record<string, unknown>) => T;

async function tous<T>(collection: string, lire: Lire<T>): Promise<T[]> {
  const snap = await getAdminFirestore().collection(collection).get();
  return snap.docs.map((d) => lire(d.id, d.data() as Record<string, unknown>));
}

async function un<T>(collection: string, id: string, lire: Lire<T>): Promise<T | null> {
  const snap = await getAdminFirestore().collection(collection).doc(id).get();
  return snap.exists ? lire(snap.id, snap.data() as Record<string, unknown>) : null;
}

const piece: Lire<Product> = (id, data) => parseProduct({ ...data, id });
const voitureLocation: Lire<LocationCar> = (id, data) => parseLocationCar({ ...data, id });
const vehicule: Lire<Vehicule> = (id, data) => ({ ...data, id }) as Vehicule;
const moto: Lire<Moto> = (id, data) => ({ ...data, id }) as Moto;

export const getProductsAdmin = () => tous('products', piece);
export const getProductByIdAdmin = (id: string) => un('products', id, piece);
export const getVehiculesAdmin = () => tous('vehicules', vehicule);
export const getVehiculeByIdAdmin = (id: string) => un('vehicules', id, vehicule);
export const getMotosAdmin = () => tous('motos', moto);
export const getMotoByIdAdmin = (id: string) => un('motos', id, moto);
export const getLocationCarsAdmin = () => tous('location-cars', voitureLocation);
export const getLocationCarByIdAdmin = (id: string) => un('location-cars', id, voitureLocation);
