import { z } from 'zod';
import type { LocationCar } from '@/lib/location-cars';

export const LocationCarWriteSchema = z.object({
  id: z.string().min(1),
  marque: z.string().min(1).max(60),
  modele: z.string().min(1).max(60),
  categorie: z.enum(['Citadine', 'Berline', 'SUV', 'Utilitaire']),
  places: z.number().int().min(1).max(9),
  transmission: z.string().min(1).max(20),
  carburant: z.string().min(1).max(20),
  prixJourEnCents: z.number().int().nonnegative(),
  prixSemaineEnCents: z.number().int().nonnegative(),
  disponible: z.boolean(),
  image: z.string(),
  reference: z.string().min(1).max(40),
  // Caution annoncée au funnel (L112-1) ; absente → défaut par catégorie.
  cautionEnCents: z.number().int().nonnegative().optional(),
  updatedAt: z.string(),
});

// Lecture tolérante : même forme. `deletedAt` (champ document) n'est gardé
// que s'il est posé : la corbeille du BO en a besoin, le site public ne lit
// jamais une voiture supprimée.
export function parseLocationCar(data: unknown): LocationCar {
  const car = LocationCarWriteSchema.parse(data);
  const deletedAt = (data as { deletedAt?: unknown } | null)?.deletedAt;
  return typeof deletedAt === 'string' ? { ...car, deletedAt } : car;
}
