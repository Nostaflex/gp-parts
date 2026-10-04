// lib/admin/form-errors.ts
// Erreurs de formulaire du BO lisibles par un non-technicien : sans ça, un
// champ vide affichait le message Zod par défaut, en anglais (« Too small:
// expected string to have >=1 characters »). Passé au moment du parse
// (`Schema.safeParse(data, PARSE_FR)`), donc les messages déjà écrits dans
// un schéma gardent la priorité (précédence Zod v4).

import type { z } from 'zod';

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

const messageFr: z.core.$ZodErrorMap = (iss) => {
  switch (iss.code) {
    case 'invalid_type':
      if (iss.input === undefined || iss.input === null || iss.input === '') {
        return 'Champ obligatoire.';
      }
      if (iss.expected === 'int') return 'Entre un nombre entier.';
      if (iss.expected === 'number') return 'Entre un nombre.';
      return 'Valeur invalide.';
    case 'too_small': {
      const min = Number(iss.minimum);
      if (iss.origin === 'string') {
        return min <= 1 ? 'Champ obligatoire.' : `${pluriel(min, 'caractère')} minimum.`;
      }
      if (iss.origin === 'array') {
        return iss.path?.at(-1) === 'images'
          ? `Ajoute au moins ${min <= 1 ? 'une photo' : `${min} photos`}.`
          : `Ajoute au moins ${pluriel(min, 'élément')}.`;
      }
      return `Minimum : ${min}.`;
    }
    case 'too_big': {
      const max = Number(iss.maximum);
      if (iss.origin === 'string') return `${pluriel(max, 'caractère')} maximum.`;
      if (iss.origin === 'array') return `${pluriel(max, 'élément')} maximum.`;
      return `Maximum : ${max}.`;
    }
    case 'invalid_value':
      return 'Choix invalide.';
    case 'invalid_format':
      if (iss.format === 'email') return 'Adresse email invalide.';
      if (iss.format === 'url') return 'Lien invalide : il doit commencer par https://';
      return 'Format invalide.';
    default:
      return undefined;
  }
};

/** Second argument de `safeParse` pour toutes les Server Actions du BO. */
export const PARSE_FR = { error: messageFr };
