// Compteurs « à traiter » pour la sidebar admin (badge par section).
// Admin SDK (rules admin-only) + agrégat count() : pas de documents lus.
// Fail-open + WARN : un badge absent ne doit jamais casser le back-office.
import { getAdminFirestore } from '@/lib/firebase-admin';

export type NavBadges = {
  commandes: number;
  reservations: number;
  demandes: number;
};

const EMPTY: NavBadges = { commandes: 0, reservations: 0, demandes: 0 };

async function countNouvelles(collection: string): Promise<number> {
  const snap = await getAdminFirestore()
    .collection(collection)
    .where('status', '==', 'nouvelle')
    .count()
    .get();
  return snap.data().count;
}

export async function getNavBadges(): Promise<NavBadges> {
  try {
    const [commandes, reservations, demandes] = await Promise.all([
      countNouvelles('orders'),
      countNouvelles('reservations'),
      countNouvelles('demandes'),
    ]);
    return { commandes, reservations, demandes };
  } catch (err) {
    console.warn('[nav-badges] comptage échoué (fail-open, badges masqués):', err);
    return EMPTY;
  }
}
