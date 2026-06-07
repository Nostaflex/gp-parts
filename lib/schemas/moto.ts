import { z } from 'zod';
import type { Moto } from '@/lib/motos';

const currentYear = new Date().getFullYear(); // intentionally evaluated at module load

const motoCaracteristiquesSchema = z.object({
  puissance: z.string().optional(),
  cylindree: z.string().optional(),
  consommation: z.string().optional(),
  poids: z.string().optional(),
  couleur: z.string().optional(),
  permis: z.enum(['A1', 'A2', 'A', 'AM']).optional(),
  premiereCirculation: z.string().optional(),
  proprietaires: z.number().int().optional(),
  garantie: z.string().optional(),
});

export const MotoSchema = z.object({
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
  categorie: z.enum(['Roadster', 'Sport', 'Trail', 'Scooter', 'Custom', 'Routière']),
  energie: z.enum(['Essence', 'Électrique']),
  options: z.array(z.string()),
  prix: z.number().int().nonnegative(), // euros entiers (convention Moto)
  mensualite: z.number().int().nonnegative(),
  // accepte une URL absolue (http/https) OU un chemin local racine (/images/...)
  image: z.string().regex(/^(https?:\/\/|\/)/, 'URL ou chemin local requis'),
  images: z
    .array(z.string().regex(/^(https?:\/\/|\/)/, 'URL ou chemin local requis'))
    .min(1)
    .max(5),
  description: z.string().min(1),
  caracteristiques: motoCaracteristiquesSchema,
  reference: z.string().min(1),
  disponibilite: z.enum(['disponible', 'reserve', 'vendu']),
  updatedAt: z.string(),
});

export function parseMoto(data: unknown): Moto {
  // MotoSchema mirrors Moto exactly — Zod infers structurally identical types
  return MotoSchema.parse(data);
}
