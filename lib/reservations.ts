// lib/reservations.ts
// Réservation de location. Prix en centimes. PII soumise à TTL RGPD (expiresAt).

export type ReservationStatus = 'nouvelle' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';

export type ReservationCustomer = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  permis: string;
};

export type Reservation = {
  id: string;
  reference: string;
  status: ReservationStatus;
  locationCarId: string;
  carLabel: string; // snapshot "Renault Clio V"
  dateDepart: string; // "YYYY-MM-DD"
  dateRetour: string; // "YYYY-MM-DD"
  nbJours: number;
  prixJourEnCents: number; // snapshot
  totalEnCents: number; // nbJours × prixJourEnCents (recalculé serveur)
  customer: ReservationCustomer;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  expiresAt: number; // unix ms — TTL Firestore (purge RGPD)
};

// Statuts qui immobilisent la voiture ; terminee/annulee la libèrent.
export const BLOCKING_STATUSES: ReservationStatus[] = ['nouvelle', 'confirmee', 'en_cours'];

// Chevauchement inclusif de plages "YYYY-MM-DD" (comparaison lexicale ISO).
// Bord commun = conflit : pas de rotation même-jour en v1.
export function rangesOverlap(aDep: string, aRet: string, bDep: string, bRet: string): boolean {
  return aDep <= bRet && bDep <= aRet;
}
