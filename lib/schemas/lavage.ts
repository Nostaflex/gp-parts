import { z } from 'zod';

// Validation des formules esthétique saisies au BO (écriture meta/lavageSettings).
// La lecture publique passe par normalizeLavageSettings (fusion tolérante) —
// ici on est STRICT : une saisie invalide est refusée avec un message FRANÇAIS
// actionnable (jamais le défaut zod anglais — leçon du 2026-08-16).

export const LavageTarifSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Libellé de tarif vide — nomme le gabarit (Citadine, SUV…) ou supprime la ligne')
    .max(30, 'Libellé de tarif trop long (30 caractères max)'),
  // TTC en centimes ; plafond 10 000 € — garde-fou de saisie, pas une règle métier.
  prixTTCEnCents: z.number().int().min(0).max(1_000_000, 'Prix trop élevé (10 000 € max)'),
});

export const LavageFormuleSchema = z
  .object({
    nom: z.string().trim().min(1, 'Nom requis').max(40, 'Nom trop long (40 max)'),
    description: z.string().trim().max(200, 'Description trop longue (200 max)'),
    inclus: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Prestation vide — supprime la ligne vide dans « Prestations incluses »')
          .max(80, 'Prestation trop longue (80 caractères max)')
      )
      .max(20, '20 prestations incluses max'),
    tarifs: z.array(LavageTarifSchema).max(6, '6 tarifs maximum par formule'),
  })
  .superRefine((f, ctx) => {
    f.tarifs.forEach((t, i) => {
      if (t.prixTTCEnCents <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tarifs', i, 'prixTTCEnCents'],
          message: `« ${f.nom} » : le tarif « ${t.label} » doit être supérieur à 0 € (ou supprime la ligne — sans tarif, la formule s'affiche « Sur devis »).`,
        });
      }
    });
  });

export const LavageSettingsSchema = z.object({
  formules: z
    .array(LavageFormuleSchema)
    .min(1, 'Au moins une formule')
    .max(8, '8 formules maximum'),
});

export type LavageSettingsInput = z.infer<typeof LavageSettingsSchema>;

// Semaine type (doc meta/lavageSemaineType) — validation stricte de la saisie
// BO ; la lecture publique passe par normalizeSemaineType (tolérante).
export const SemaineTypeSchema = z.object({
  jours: z.record(
    z.enum(['1', '2', '3', '4', '5', '6', '7']),
    z.object({
      ouvert: z.boolean(),
      creneaux: z
        .array(z.string().trim().min(1, 'Créneau vide dans la semaine type'))
        .max(20, '20 créneaux max par jour'),
    })
  ),
});
