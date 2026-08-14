// Compteurs « à traiter » pour la sidebar admin (badge par section).
// Admin SDK (rules admin-only) + agrégat count() : pas de documents lus.
// Fail-open + WARN : un badge absent ne doit jamais casser le back-office.
import { cache } from 'react';

import { getAdminFirestore } from '@/lib/firebase-admin';

export type NavBadges = {
  commandes: number;
  reservations: number;
  demandes: number;
  avis: number;
};

const EMPTY: NavBadges = { commandes: 0, reservations: 0, demandes: 0, avis: 0 };

// Statuts « encore à traiter » par collection : tout ce qui n'est pas
// terminal. Ne compter que 'nouvelle' faisait mentir le badge — une commande
// confirmée ou en préparation disparaissait du compteur alors qu'elle
// demande toujours une action de l'admin.
const OPEN_STATUSES: Record<keyof NavBadges, { collection: string; statuses: string[] }> = {
  commandes: {
    collection: 'orders',
    statuses: ['nouvelle', 'confirmee', 'preparation', 'expediee'],
  },
  reservations: { collection: 'reservations', statuses: ['nouvelle', 'confirmee', 'en_cours'] },
  demandes: { collection: 'demandes', statuses: ['nouvelle', 'en_cours'] },
  avis: { collection: 'avis', statuses: ['nouveau'] },
};

async function countOuvertes(key: keyof NavBadges): Promise<number> {
  const { collection, statuses } = OPEN_STATUSES[key];
  const snap = await getAdminFirestore()
    .collection(collection)
    .where('status', 'in', statuses)
    .count()
    .get();
  return snap.data().count;
}

// React.cache : dédoublonne par requête — le layout shell ET le dashboard
// appellent getNavBadges() sur /admin/dashboard ; sans cache, 8 count() au lieu de 4.
export const getNavBadges = cache(async (): Promise<NavBadges> => {
  try {
    const [commandes, reservations, demandes, avis] = await Promise.all([
      countOuvertes('commandes'),
      countOuvertes('reservations'),
      countOuvertes('demandes'),
      countOuvertes('avis'),
    ]);
    return { commandes, reservations, demandes, avis };
  } catch (err) {
    console.warn('[nav-badges] comptage échoué (fail-open, badges masqués):', err);
    return EMPTY;
  }
});
