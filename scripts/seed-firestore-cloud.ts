/**
 * Seed Firestore cloud avec les produits statiques.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx tsx scripts/seed-firestore-cloud.ts
 *
 * ATTENTION : écrase les documents existants avec le même ID.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PRODUCTS } from '../lib/products';
import { parseProduct } from '../lib/schemas/product';
import { LOCATION_CARS } from '../lib/location-cars';
import { parseLocationCar } from '../lib/schemas/location-car';
import { VEHICULES } from '../lib/vehicules';
import { parseVehicule } from '../lib/schemas/vehicule';
import { MOTOS } from '../lib/motos';
import { parseMoto } from '../lib/schemas/moto';

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('ERROR: Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf-8'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-gp-parts',
});

const db = getFirestore();

async function seed() {
  console.log(`Seeding ${PRODUCTS.length} products to Firestore cloud...`);

  const batch = db.batch();

  for (const product of PRODUCTS) {
    const validated = parseProduct(product);
    const ref = db.collection('products').doc(validated.id);
    batch.set(ref, validated);
  }

  // Parc de location. deletedAt: null est REQUIS — la lecture filtre
  // where('deletedAt','==',null), un doc sans ce champ ne serait jamais retourné.
  // updatedAt reste une string (le schéma de lecture l'exige).
  for (const car of LOCATION_CARS) {
    const validated = parseLocationCar(car);
    const ref = db.collection('location-cars').doc(validated.id);
    batch.set(ref, { ...validated, deletedAt: null });
  }

  // Véhicules à vendre (getVehicules ne filtre pas deletedAt → pas requis ici).
  for (const vehicule of VEHICULES) {
    const validated = parseVehicule(vehicule);
    const ref = db.collection('vehicules').doc(validated.id);
    batch.set(ref, validated);
  }

  // Motos à vendre.
  for (const moto of MOTOS) {
    const validated = parseMoto(moto);
    const ref = db.collection('motos').doc(validated.id);
    batch.set(ref, validated);
  }

  await batch.commit();
  console.log(
    `Done! ${PRODUCTS.length} products + ${LOCATION_CARS.length} location-cars + ` +
      `${VEHICULES.length} vehicules + ${MOTOS.length} motos seeded.`
  );
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
