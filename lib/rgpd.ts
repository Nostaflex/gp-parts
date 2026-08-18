// lib/rgpd.ts
// Exercice des droits RGPD (lot 6 bis) : les 5 droits actionnables depuis
// /mentions-legales arrivent au BO comme des demandes type 'rgpd' — plus
// un simple mailto. Logique pure, testable : catalogue des droits et calcul
// de l'échéance légale de réponse (30 jours, art. 12.3 RGPD).

export const RGPD_DELAI_JOURS = 30;

export type DroitRgpd = 'acces' | 'rectification' | 'effacement' | 'portabilite' | 'opposition';

export const DROITS_RGPD: { key: DroitRgpd; label: string; description: string }[] = [
  {
    key: 'acces',
    label: 'Accès',
    description: 'Recevoir la copie de tout ce que nous avons sur vous.',
  },
  {
    key: 'rectification',
    label: 'Rectification',
    description: 'Corriger une adresse, un numéro, une erreur.',
  },
  {
    key: 'effacement',
    label: 'Effacement',
    description: 'Tout supprimer, sauf ce que la comptabilité oblige à garder.',
  },
  {
    key: 'portabilite',
    label: 'Portabilité',
    description: 'Récupérer vos données dans un fichier réutilisable.',
  },
  {
    key: 'opposition',
    label: 'Opposition',
    description: 'Refuser un usage précis, par exemple la mesure d’audience.',
  },
];

export function droitLabel(key: string): string {
  return DROITS_RGPD.find((d) => d.key === key)?.label ?? key;
}

/** Date limite de réponse (ISO) : création + 30 jours. */
export function echeanceRgpd(createdAtISO: string): Date {
  const d = new Date(createdAtISO);
  d.setDate(d.getDate() + RGPD_DELAI_JOURS);
  return d;
}

/** Jours restants avant l'échéance (négatif = dépassée). */
export function joursRestantsRgpd(createdAtISO: string, nowMs: number): number {
  return Math.ceil((echeanceRgpd(createdAtISO).getTime() - nowMs) / 86400000);
}
