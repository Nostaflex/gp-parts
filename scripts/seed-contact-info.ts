/**
 * Pose les coordonnées dans Firestore (meta/contactInfo).
 * Édite l'objet `contact` ci-dessous avec les vraies infos de Stéphane, puis :
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=car-performance971 \
 *   npx tsx scripts/seed-contact-info.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!saPath || !projectId) {
  console.error('ERROR: set GOOGLE_APPLICATION_CREDENTIALS + NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  process.exit(1);
}

const contact = {
  phone: '+590690000000',
  phoneDisplay: '0690 00 00 00',
  email: 'contact@car-performance.gp',
  whatsappNumber: '590690000000',
  address: {
    street: 'Zone industrielle de Jarry',
    postalCode: '97122',
    city: 'Baie-Mahault',
    region: 'Guadeloupe',
  },
  hours: { weekdayOpen: '07:30', weekdayClose: '17:30', saturdayOpen: '08:00', saturdayClose: '13:00' },
  geo: { lat: 16.2415, lng: -61.5611 },
  social: { facebook: '', instagram: '', google: '' },
  updatedAt: Date.now(),
  updatedBy: 'seed-script',
};

initializeApp({ credential: cert(JSON.parse(readFileSync(resolve(saPath), 'utf-8'))), projectId });
getFirestore()
  .doc('meta/contactInfo')
  .set(contact, { merge: true })
  .then(() => {
    console.log('✓ meta/contactInfo posé');
    process.exit(0);
  })
  .catch((e) => {
    console.error('seed-contact-info failed:', e);
    process.exit(1);
  });
