// Formules esthétique automobile éditables par le BO (doc meta/lavageSettings).
// Remplace l'ancien fichier statique app/lavage/formules.ts : les offres,
// packs et prix appartiennent à Stéphane, pas au code. Miroir du pattern
// location-settings (défauts + fusion tolérante).
//
// v2 (2026-08-16, gamme finalisée par Stéphane) : un tarif unique par formule
// ne suffit plus — le prix dépend du gabarit (Citadine / Gamme B / SUV…).
// Chaque formule porte une liste de tarifs ; liste vide → « Sur devis ».
import { VAT_RATE } from '@/lib/config';

export type LavageTarif = {
  /** Gabarit ou libellé du tarif (Citadine, Gamme B, SUV, Forfait…). */
  label: string;
  /** Prix TTC en centimes (convention repo). */
  prixTTCEnCents: number;
};

export type LavageFormule = {
  nom: string;
  description: string;
  inclus: string[];
  /** Tarifs par gabarit ; liste vide → « Sur devis » affiché. */
  tarifs: LavageTarif[];
};

export type LavageSettings = {
  formules: LavageFormule[];
};

// Défauts = la gamme finalisée par Stéphane (2026-08-16) : deux formules
// principales + forfait grands gabarits. Servent tant que le BO n'a rien saisi.
export const DEFAULT_LAVAGE_SETTINGS: LavageSettings = {
  formules: [
    {
      nom: 'Premium Wash',
      description: 'Intérieur & extérieur : le nettoyage complet de votre véhicule, à la main.',
      inclus: [
        'Décrassage au jet d’eau (poussière, boue, saletés)',
        'Shampoing manuel de la carrosserie',
        'Rinçage complet',
        'Nettoyage des jantes',
        'Brillance des pneus',
        'Finition des plastiques extérieurs',
        'Aspiration de l’habitacle',
        'Aspiration des tapis et moquettes',
        'Aspiration du coffre',
        'Dépoussiérage intérieur',
        'Nettoyage multisurface',
        'Nettoyage des vitres',
        'Parfum d’ambiance intérieur',
      ],
      tarifs: [
        { label: 'Citadine', prixTTCEnCents: 3000 },
        { label: 'Gamme B', prixTTCEnCents: 5000 },
        { label: 'SUV', prixTTCEnCents: 9000 },
      ],
    },
    {
      nom: 'Ultimate Wash',
      description: 'L’intégralité du Premium Wash, poussée au niveau supérieur.',
      inclus: [
        'Tout le Premium Wash inclus',
        'Décontamination chimique extérieure',
        'Décontamination mécanique extérieure',
        'Lustrage',
        'Nettoyage du plafonnier',
        'Shampoing des sièges',
      ],
      tarifs: [
        { label: 'Citadine', prixTTCEnCents: 5000 },
        { label: 'Gamme B', prixTTCEnCents: 8000 },
        { label: 'SUV', prixTTCEnCents: 12000 },
      ],
    },
    {
      nom: 'Pick-up & Utilitaire',
      description: 'Forfait unique pour les grands gabarits.',
      inclus: [],
      tarifs: [{ label: 'Forfait', prixTTCEnCents: 11000 }],
    },
  ],
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Fusion tolérante Firestore → settings complets. Une liste vide ou
 * inexploitable retombe sur les défauts (le public ne voit jamais 0 formule). */
export function normalizeLavageSettings(raw: unknown): LavageSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_LAVAGE_SETTINGS;
  const list = (raw as Record<string, unknown>).formules;
  if (!Array.isArray(list)) return DEFAULT_LAVAGE_SETTINGS;

  const formules: LavageFormule[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const f = item as Record<string, unknown>;
    const nom = str(f.nom);
    if (!nom) continue;

    const tarifs: LavageTarif[] = [];
    if (Array.isArray(f.tarifs)) {
      for (const t of f.tarifs) {
        if (!t || typeof t !== 'object') continue;
        const tr = t as Record<string, unknown>;
        const label = str(tr.label);
        const prix = isNum(tr.prixTTCEnCents) ? Math.round(tr.prixTTCEnCents) : 0;
        if (label && prix > 0) tarifs.push({ label, prixTTCEnCents: prix });
      }
    } else if (f.mode === 'prix' && isNum(f.prixTTCEnCents) && f.prixTTCEnCents > 0) {
      // Legacy v1 (mode devis/prix, tarif unique) : migré en un tarif sans
      // gabarit nommé. Aucun doc v1 n'a jamais été écrit (bug d'enregistrement
      // 2026-08-16) — garde-fou de lecture, pas un chemin attendu.
      tarifs.push({ label: 'Tarif', prixTTCEnCents: Math.round(f.prixTTCEnCents) });
    }

    formules.push({
      nom,
      description: str(f.description),
      inclus: Array.isArray(f.inclus) ? f.inclus.map(str).filter(Boolean) : [],
      tarifs,
    });
  }
  return formules.length > 0 ? { formules } : DEFAULT_LAVAGE_SETTINGS;
}

/** Sérialisation BO → payload d'enregistrement. Nettoie les lignes « inclus »
 * (trim + lignes vides retirées) et les tarifs (libellés trimés, lignes
 * entièrement vides retirées) : le textarea produit une ligne vide au moindre
 * retour à la ligne final, et le schéma strict refusait alors TOUTE la
 * sauvegarde (bug « l'enregistrement ne reste pas », 2026-08-16). */
export function serializeFormulesForSave(formules: LavageFormule[]): string {
  return JSON.stringify(
    formules.map((f) => ({
      ...f,
      inclus: f.inclus.map((s) => s.trim()).filter(Boolean),
      tarifs: f.tarifs
        .map((t) => ({ ...t, label: t.label.trim() }))
        .filter((t) => t.label !== '' || t.prixTTCEnCents > 0),
    }))
  );
}

/** HT depuis un TTC en centimes — TVA Guadeloupe 8,5 % (lib/config.VAT_RATE). */
export function htFromTTCEnCents(ttcEnCents: number): number {
  return Math.round(ttcEnCents / (1 + VAT_RATE));
}
