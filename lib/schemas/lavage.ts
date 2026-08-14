import { z } from 'zod';

// Validation des formules lavage saisies au BO (écriture meta/lavageSettings).
// La lecture publique passe par normalizeLavageSettings (fusion tolérante) —
// ici on est STRICT : une saisie invalide est refusée avec un message.

export const LavageFormuleSchema = z
  .object({
    nom: z.string().trim().min(1, 'Nom requis').max(40, 'Nom trop long (40 max)'),
    description: z.string().trim().max(200, 'Description trop longue (200 max)'),
    inclus: z.array(z.string().trim().min(1).max(80)).max(12, '12 prestations incluses max'),
    mode: z.enum(['devis', 'prix']),
    // TTC en centimes ; plafond 10 000 € — garde-fou de saisie, pas une règle métier.
    prixTTCEnCents: z.number().int().min(0).max(1_000_000),
  })
  .superRefine((f, ctx) => {
    if (f.mode === 'prix' && f.prixTTCEnCents <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prixTTCEnCents'],
        message: `« ${f.nom} » : un prix affiché doit être supérieur à 0 € (ou passe la formule en « Sur devis »).`,
      });
    }
  });

export const LavageSettingsSchema = z.object({
  formules: z
    .array(LavageFormuleSchema)
    .min(1, 'Au moins une formule')
    .max(8, '8 formules maximum'),
});

export type LavageSettingsInput = z.infer<typeof LavageSettingsSchema>;
