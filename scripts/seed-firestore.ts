/**
 * Seed script — Importe les produits statiques dans l'émulateur Firestore.
 *
 * Usage :
 *   npx tsx scripts/seed-firestore.ts
 *
 * Prérequis :
 *   - L'émulateur Firestore doit être lancé : npx firebase emulators:start
 *   - Le script utilise firebase-admin avec FIRESTORE_EMULATOR_HOST
 *
 * Ce script :
 *   1. Se connecte à l'émulateur Firestore (localhost:8080)
 *   2. Supprime tous les documents existants dans la collection 'products'
 *   3. Importe les produits depuis lib/products.ts
 *   4. Crée un document metadata/stats avec les compteurs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Pointer vers l'émulateur
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Init Firebase Admin avec un project ID factice (l'émulateur l'accepte)
const app = initializeApp({
  projectId: 'demo-gp-parts',
});

const db = getFirestore(app);

async function clearCollection(collectionName: string): Promise<number> {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}

async function seed() {
  console.log('🌱 Seed Firestore — GP Parts\n');

  // Import dynamique des produits (le fichier utilise des imports TS/path aliases)
  // On charge directement depuis le build — nécessite tsx pour résoudre les alias
  const { PRODUCTS } = await import('../lib/products');

  console.log(`📦 ${PRODUCTS.length} produits trouvés dans lib/products.ts`);

  // 1. Nettoyer la collection existante
  const deleted = await clearCollection('products');
  if (deleted > 0) {
    console.log(`🗑️  ${deleted} documents supprimés de 'products'`);
  }

  // 2. Importer les produits
  const batch = db.batch();
  let count = 0;

  for (const product of PRODUCTS) {
    const docRef = db.collection('products').doc(product.id);
    batch.set(docRef, {
      slug: product.slug,
      name: product.name,
      reference: product.reference,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      ...(product.priceOriginal && { priceOriginal: product.priceOriginal }),
      images: product.images,
      category: product.category,
      vehicleType: product.vehicleType,
      compatibility: product.compatibility,
      stock: product.stock,
      isPromoted: product.isPromoted,
      createdAt: product.createdAt,
    });
    count++;
  }

  await batch.commit();
  console.log(`✅ ${count} produits importés dans 'products'`);

  // 3. Créer les métadonnées
  const categories = [...new Set(PRODUCTS.map((p) => p.category))].sort();
  const brands = [...new Set(PRODUCTS.flatMap((p) => p.compatibility.map((c) => c.brand)))].sort();

  await db
    .collection('metadata')
    .doc('stats')
    .set({
      totalProducts: PRODUCTS.length,
      categories,
      brands,
      lastSeedAt: new Date().toISOString(),
      inStock: PRODUCTS.filter((p) => p.stock > 0).length,
      outOfStock: PRODUCTS.filter((p) => p.stock === 0).length,
      promoted: PRODUCTS.filter((p) => p.isPromoted).length,
    });

  console.log(`📊 Métadonnées créées: ${categories.length} catégories, ${brands.length} marques`);
  console.log('\n🎉 Seed terminé ! Ouvre http://localhost:4000 pour voir les données.\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});
