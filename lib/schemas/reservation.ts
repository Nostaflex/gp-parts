import { z } from 'zod';
import type { Reservation } from '@/lib/reservations';

const customerSchema = z.object({
  prenom: z.string().min(1).max(50),
  nom: z.string().min(1).max(50),
  email: z.string().email().max(100),
  telephone: z.string().min(8).max(20),
  permis: z.string().min(1).max(40),
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
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.number(),
});

export function parseReservation(data: unknown): Reservation {
  return reservationSchema.parse(data);
}
