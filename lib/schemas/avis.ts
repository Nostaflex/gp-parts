import { z } from 'zod';
import { AVIS_PRESTATIONS } from '@/lib/avis';

// Dépôt PUBLIC d'un avis (formulaire /avis) — strict, messages FR.
export const AvisDepotSchema = z.object({
  prenom: z.string().trim().min(2, 'Prénom requis (2 caractères min)').max(40, 'Prénom trop long'),
  note: z.number().int().min(1, 'Choisissez une note').max(5),
  texte: z
    .string()
    .trim()
    .min(20, 'Dites-en un peu plus (20 caractères min) — votre avis sera lu avant publication')
    .max(800, 'Avis trop long (800 caractères max)'),
  prestation: z.enum(AVIS_PRESTATIONS),
  // Email jamais affiché — uniquement pour pouvoir vous recontacter si besoin.
  email: z.union([z.literal(''), z.string().trim().email('Email invalide')]),
});

export type AvisDepotInput = z.infer<typeof AvisDepotSchema>;

// Réponse du pro (BO) — le SEUL texte que l'admin écrit (jamais l'avis lui-même).
export const AvisReponseSchema = z
  .string()
  .trim()
  .max(500, 'Réponse trop longue (500 caractères max)');
