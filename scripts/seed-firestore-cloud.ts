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

  await batch.commit();
  console.log(`Done! ${PRODUCTS.length} products seeded.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
