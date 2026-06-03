'use server';

import { generateReservationReference } from '@/lib/utils';
import { getAdapter } from '@/lib/data';
import { sendReservationEmails } from '@/lib/emails/send';
import type { Reservation } from '@/lib/reservations';

export interface ReservationValidationResult {
  success: boolean;
  errors: Record<string, string>;
  reference?: string;
}

const FIELD_LIMITS = { prenom: 50, nom: 50, email: 100, telephone: 20, permis: 40 } as const;
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 mois (RGPD)
const DAY_MS = 24 * 60 * 60 * 1000;

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export async function validateReservation(input: {
  locationCarId: string;
  dateDepart: string;
  dateRetour: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  permis: string;
  consent: boolean;
}): Promise<ReservationValidationResult> {
  const errors: Record<string, string> = {};

  const prenom = sanitize(input.prenom);
  const nom = sanitize(input.nom);
  const email = sanitize(input.email);
  const telephone = sanitize(input.telephone);
  const permis = sanitize(input.permis);
  const locationCarId = sanitize(input.locationCarId);
  const dateDepart = sanitize(input.dateDepart);
  const dateRetour = sanitize(input.dateRetour);

  if (!prenom || prenom.length > FIELD_LIMITS.prenom) errors.prenom = 'Prénom requis';
  if (!nom || nom.length > FIELD_LIMITS.nom) errors.nom = 'Nom requis';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.length > FIELD_LIMITS.email || !emailRe.test(email) || /[<>"']/.test(email)) {
    errors.email = 'Email invalide';
  }
  if (!/^[0-9+\s().-]{8,20}$/.test(telephone)) errors.telephone = 'Téléphone invalide';
  if (!permis || permis.length > FIELD_LIMITS.permis) errors.permis = 'Numéro de permis requis';

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const depMs = Date.parse(dateDepart);
  const retMs = Date.parse(dateRetour);
  if (!dateRe.test(dateDepart) || Number.isNaN(depMs)) {
    errors.dateDepart = 'Date de départ invalide';
  } else if (depMs < Date.now() - DAY_MS) {
    errors.dateDepart = 'La date de départ est passée';
  }
  if (!dateRe.test(dateRetour) || Number.isNaN(retMs)) {
    errors.dateRetour = 'Date de retour invalide';
  } else if (!Number.isNaN(depMs) && retMs <= depMs) {
    errors.dateRetour = 'Le retour doit être après le départ';
  }

  if (input.consent !== true) errors.consent = 'Consentement requis';

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const adapter = await getAdapter();
  const car = await adapter.getLocationCarById(locationCarId);
  if (!car) return { success: false, errors: { _form: 'Voiture introuvable.' } };
  if (!car.disponible) return { success: false, errors: { _form: 'Voiture indisponible.' } };

  const nbJours = Math.max(1, Math.ceil((retMs - depMs) / DAY_MS));
  const totalEnCents = nbJours * car.prixJourEnCents;
  const now = new Date().toISOString();
  const reference = generateReservationReference();

  const data: Omit<Reservation, 'id'> = {
    reference,
    status: 'nouvelle',
    locationCarId: car.id,
    carLabel: `${car.marque} ${car.modele}`,
    dateDepart,
    dateRetour,
    nbJours,
    prixJourEnCents: car.prixJourEnCents,
    totalEnCents,
    customer: { prenom, nom, email, telephone, permis },
    createdAt: now,
    updatedAt: now,
    expiresAt: Date.now() + TTL_MS,
  };

  const id = await adapter.createReservation(data);
  sendReservationEmails({ ...data, id });

  return { success: true, errors: {}, reference };
}
