import { z } from 'zod';
import type { Vehicule } from '@/lib/vehicules';

const currentYear = new Date().getFullYear(); // intentionally evaluated at module load

const vehiculeCaracteristiquesSchema = z.object({
  puissance: z.string().optional(),
  cylindree: z.string().optional(),
  consommation: z.string().optional(),
  co2: z.string().optional(),
  couleur: z.string().optional(),
  carrosserie: z.string().optional(),
  portes: z.number().int().optional(),
  critAir: z.string().optional(),
  premiereCirculation: z.string().optional(),
  proprietaires: z.number().int().optional(),
  garantie: z.string().optional(),
});

export const VehiculeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['occasion', 'neuf']),
  marque: z.string().min(1),
  modele: z.string().min(1),
  annee: z
    .number()
    .int()
    .min(1990)
    .max(currentYear + 1),
  km: z.number().int().min(0),
  energie: z.enum(['Essence', 'Diesel', 'Hybride']),
  transmission: z.string().min(1),
  places: z.number().int().min(1).max(9),
  options: z.array(z.string()),
  prix: z.number().int().nonnegative(), // euros entiers (convention Vehicule)
  mensualite: z.number().int().nonnegative(),
  // accepte une URL absolue (http/https) OU un chemin local racine (/images/...)
  image: z.string().regex(/^(https?:\/\/|\/)/, 'URL ou chemin local requis'),
  images: z
    .array(z.string().regex(/^(https?:\/\/|\/)/, 'URL ou chemin local requis'))
    .min(1)
    .max(5),
  description: z.string().min(1),
  caracteristiques: vehiculeCaracteristiquesSchema,
  reference: z.string().min(1),
  disponibilite: z.enum(['disponible', 'reserve', 'vendu']),
  updatedAt: z.string(),
});

export function parseVehicule(data: unknown): Vehicule {
  // VehiculeSchema mirrors Vehicule exactly — Zod infers structurally identical types
  return VehiculeSchema.parse(data);
}
