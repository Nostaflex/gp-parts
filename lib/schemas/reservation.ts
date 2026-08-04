import { z } from 'zod';
import type { Reservation } from '@/lib/reservations';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEURE_RE = /^\d{2}:\d{2}$/;

const customerSchema = z.object({
  prenom: z.string().min(1).max(50),
  nom: z.string().min(1).max(50),
  email: z.string().email().max(100),
  telephone: z.string().min(8).max(20),
  permis: z.string().min(1).max(40),
  // Funnel v2 — optionnels : lecture tolérante des réservations antérieures.
  dateNaissance: z.string().regex(DATE_RE).optional(),
  dateObtentionPermis: z.string().regex(DATE_RE).optional(),
  adresse: z
    .object({
      rue: z.string().min(1).max(120),
      codePostal: z.string().min(4).max(10),
      ville: z.string().min(1).max(80),
    })
    .optional(),
});

export const reservationSchema = z.object({
  id: z.string().min(1),
  reference: z.string().min(1),
  status: z.enum(['nouvelle', 'confirmee', 'en_cours', 'terminee', 'annulee']),
  locationCarId: z.string().min(1),
  carLabel: z.string().min(1),
  dateDepart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateRetour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nbJours: z.number().int().min(1),
  prixJourEnCents: z.number().int().nonnegative(),
  totalEnCents: z.number().int().nonnegative(),
  customer: customerSchema,
  heureDepart: z.string().regex(HEURE_RE).optional(),
  heureRetour: z.string().regex(HEURE_RE).optional(),
  cautionEnCents: z.number().int().nonnegative().optional(),
  cglAcceptedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.number(),
});

export function parseReservation(data: unknown): Reservation {
  return reservationSchema.parse(data);
}
