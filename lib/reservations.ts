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
