// scripts/seed-location-cars.ts
// Peuple la collection Firestore `location-cars` depuis le seed LOCATION_CARS.
// Idempotent : ne réécrit pas un doc déjà présent.
// Lancer : npx tsx scripts/seed-location-cars.ts

import { getAdminFirestore } from '../lib/firebase-admin';
import { LOCATION_CARS } from '../lib/location-cars';

async function main() {
  const db = getAdminFirestore();
  let created = 0;
  let skipped = 0;

  for (const car of LOCATION_CARS) {
    const ref = db.doc(`location-cars/${car.id}`);
    const snap = await ref.get();
    if (snap.exists) {
      skipped++;
      continue;
    }
    await ref.set({ ...car, deletedAt: null });
    created++;
  }

  console.log(`[seed-location-cars] créés: ${created}, ignorés (déjà présents): ${skipped}`);
}

main().catch((err) => {
  console.error('[seed-location-cars] échec:', err);
  process.exit(1);
});
