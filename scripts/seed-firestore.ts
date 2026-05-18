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
 *   4. Supprime puis importe la collection 'vehicules' depuis lib/vehicules.ts
 *   5. Supprime puis importe la collection 'motos' depuis lib/motos.ts
 *   6. Crée un document metadata/stats avec les compteurs
 */

// Guard: FIRESTORE_EMULATOR_HOST doit être défini avant les imports Firebase
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('ERROR: FIRESTORE_EMULATOR_HOST doit être défini (ex: 127.0.0.1:8080)');
  process.exit(1);
}

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseProduct } from '../lib/schemas/product';
import { parseVehicule } from '../lib/schemas/vehicule';
import { parseMoto } from '../lib/schemas/moto';

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
    const validated = parseProduct(product);
    const docRef = db.collection('products').doc(validated.id);
    batch.set(docRef, {
      slug: validated.slug,
      name: validated.name,
      reference: validated.reference,
      description: validated.description,
      shortDescription: validated.shortDescription,
      price: validated.price,
      ...(validated.priceOriginal && { priceOriginal: validated.priceOriginal }),
      images: validated.images,
      category: validated.category,
      vehicleType: validated.vehicleType,
      compatibility: validated.compatibility,
      stock: validated.stock,
      isPromoted: validated.isPromoted,
      createdAt: validated.createdAt,
    });
    count++;
  }

  await batch.commit();
  console.log(`✅ ${count} produits importés dans 'products'`);

  // 3. Importer les véhicules (même pattern que les produits)
  const { VEHICULES } = await import('../lib/vehicules');

  console.log(`\n🚗 ${VEHICULES.length} véhicules trouvés dans lib/vehicules.ts`);

  const deletedVehicules = await clearCollection('vehicules');
  if (deletedVehicules > 0) {
    console.log(`🗑️  ${deletedVehicules} documents supprimés de 'vehicules'`);
  }

  const vehiculesBatch = db.batch();
  let vehiculesCount = 0;

  for (const vehicule of VEHICULES) {
    const validated = parseVehicule(vehicule);
    const docRef = db.collection('vehicules').doc(validated.id);
    vehiculesBatch.set(docRef, validated);
    vehiculesCount++;
  }

  await vehiculesBatch.commit();
  console.log(`✅ ${vehiculesCount} véhicules importés dans 'vehicules'`);

  // 4. Importer les motos (même pattern que les véhicules)
  const { MOTOS } = await import('../lib/motos');

  console.log(`\n🏍️ ${MOTOS.length} motos trouvées dans lib/motos.ts`);

  const deletedMotos = await clearCollection('motos');
  if (deletedMotos > 0) {
    console.log(`🗑️  ${deletedMotos} documents supprimés de 'motos'`);
  }

  const motosBatch = db.batch();
  let motosCount = 0;

  for (const moto of MOTOS) {
    const validated = parseMoto(moto);
    const docRef = db.collection('motos').doc(validated.id);
    motosBatch.set(docRef, validated);
    motosCount++;
  }

  await motosBatch.commit();
  console.log(`✅ ${motosCount} motos importées dans 'motos'`);

  // 5. Créer les métadonnées
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
      vehiculesCount: VEHICULES.length,
      vehiculesDisponibles: VEHICULES.filter((v) => v.disponibilite === 'disponible').length,
      motosCount: MOTOS.length,
      motosDisponibles: MOTOS.filter((m) => m.disponibilite === 'disponible').length,
    });

  console.log(`📊 Métadonnées créées: ${categories.length} catégories, ${brands.length} marques`);
  console.log('\n🎉 Seed terminé ! Ouvre http://localhost:4000 pour voir les données.\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});
