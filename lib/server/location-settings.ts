// Lecture des réglages location via Admin SDK (doc meta/locationSettings).
// Fail-open + WARN : les défauts ratifiés s'appliquent si Firestore échoue.
import { getAdminFirestore } from '@/lib/firebase-admin';
import {
  normalizeLocationSettings,
  DEFAULT_LOCATION_SETTINGS,
  type LocationSettings,
} from '@/lib/location-settings';

export async function getLocationSettings(): Promise<LocationSettings> {
  try {
    const snap = await getAdminFirestore().doc('meta/locationSettings').get();
    return normalizeLocationSettings(snap.exists ? snap.data() : null);
  } catch (err) {
    console.warn('[location-settings] lecture échouée (fail-open, défauts):', err);
    return DEFAULT_LOCATION_SETTINGS;
  }
}
