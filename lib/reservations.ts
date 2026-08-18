// lib/reservations.ts
// Réservation de location. Prix en centimes. PII soumise à TTL RGPD (expiresAt).

export type ReservationStatus = 'nouvelle' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';

export type ReservationCustomer = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  permis: string;
  // Funnel v2 (2026-07-31) — optionnels : les réservations antérieures n'en ont pas.
  dateNaissance?: string; // "YYYY-MM-DD" — gate âge minimum
  dateObtentionPermis?: string; // "YYYY-MM-DD" — gate ancienneté
  adresse?: { rue: string; codePostal: string; ville: string };
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
  // Funnel v2 — heure collectée, prix au jour (décision ratifiée) ;
  // caution ANNONCÉE (L112-1), prise au comptoir ; CGL horodatées.
  heureDepart?: string; // "HH:MM"
  heureRetour?: string; // "HH:MM"
  cautionEnCents?: number; // snapshot au moment de la résa
  cglAcceptedAt?: string; // ISO — preuve d'acceptation des CGL
  marketingOptIn?: boolean; // case facultative jamais pré-cochée (CNIL, lot 6)
  createdAt: string; // ISO
  updatedAt: string; // ISO
  expiresAt: number; // unix ms — TTL Firestore (purge RGPD)
};

/** Âge en années révolues à une date donnée (comparaisons lexicales ISO). */
export function ageAtDate(dateNaissance: string, atDate: string): number {
  const [by, bm, bd] = dateNaissance.split('-').map(Number);
  const [ay, am, ad] = atDate.split('-').map(Number);
  let age = ay - by;
  if (am < bm || (am === bm && ad < bd)) age -= 1;
  return age;
}

/** Années révolues entre deux dates ISO (ancienneté de permis). */
export function yearsBetween(fromDate: string, atDate: string): number {
  return ageAtDate(fromDate, atDate);
}

// Charnière LCD / LLD ratifiée 2026-07-31 : ≥ 30 jours → devis longue durée.
export const LLD_SEUIL_JOURS = 30;

// Statuts qui immobilisent la voiture ; terminee/annulee la libèrent.
export const BLOCKING_STATUSES: ReservationStatus[] = ['nouvelle', 'confirmee', 'en_cours'];

// Chevauchement inclusif de plages "YYYY-MM-DD" (comparaison lexicale ISO).
// Bord commun = conflit : pas de rotation même-jour en v1.
export function rangesOverlap(aDep: string, aRet: string, bDep: string, bRet: string): boolean {
  return aDep <= bRet && bDep <= aRet;
}
