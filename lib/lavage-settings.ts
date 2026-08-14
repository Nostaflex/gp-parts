// Formules lavage éditables par le BO (doc meta/lavageSettings).
// Remplace l'ancien fichier statique app/lavage/formules.ts : les offres,
// packs et prix appartiennent à Stéphane, pas au code. Miroir du pattern
// location-settings (défauts + fusion tolérante).
import { VAT_RATE } from '@/lib/config';

export type LavageFormuleMode = 'devis' | 'prix';

export type LavageFormule = {
  nom: string;
  description: string;
  inclus: string[];
  /** 'devis' → « Sur devis » affiché ; 'prix' → prix TTC (+ HT calculé). */
  mode: LavageFormuleMode;
  /** Prix TTC en centimes (convention repo). Ignoré en mode 'devis'. */
  prixTTCEnCents: number;
};

export type LavageSettings = {
  formules: LavageFormule[];
};

// Défauts = les 4 formules historiques, en « Sur devis » tant que Stéphane
// n'a pas saisi ses prix (question S3 du 2026-08-12).
export const DEFAULT_LAVAGE_SETTINGS: LavageSettings = {
  formules: [
    {
      nom: 'Extérieur',
      description: 'Carrosserie propre, jantes et vitres impeccables.',
      inclus: [
        'Prélavage + lavage main',
        'Jantes & pneus',
        'Vitres extérieures',
        'Séchage microfibre',
      ],
      mode: 'devis',
      prixTTCEnCents: 0,
    },
    {
      nom: 'Intérieur',
      description: 'Habitacle aspiré, plastiques et vitres nettoyés.',
      inclus: [
        'Aspiration complète',
        'Plastiques & tableau de bord',
        'Vitres intérieures',
        'Tapis',
      ],
      mode: 'devis',
      prixTTCEnCents: 0,
    },
    {
      nom: 'Complet',
      description: 'Extérieur + intérieur, le véhicule comme neuf.',
      inclus: ['Formule Extérieur', 'Formule Intérieur', 'Finitions & détails'],
      mode: 'devis',
      prixTTCEnCents: 0,
    },
    {
      nom: 'Rénovation',
      description: 'Traitement en profondeur pour redonner de l’éclat.',
      inclus: [
        'Décontamination carrosserie',
        'Polissage / lustrage',
        'Shampoing sièges & moquettes',
      ],
      mode: 'devis',
      prixTTCEnCents: 0,
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
    formules.push({
      nom,
      description: str(f.description),
      inclus: Array.isArray(f.inclus) ? f.inclus.map(str).filter(Boolean) : [],
      mode: f.mode === 'prix' ? 'prix' : 'devis',
      prixTTCEnCents:
        isNum(f.prixTTCEnCents) && f.prixTTCEnCents >= 0 ? Math.round(f.prixTTCEnCents) : 0,
    });
  }
  return formules.length > 0 ? { formules } : DEFAULT_LAVAGE_SETTINGS;
}

/** HT depuis un TTC en centimes — TVA Guadeloupe 8,5 % (lib/config.VAT_RATE). */
export function htFromTTCEnCents(ttcEnCents: number): number {
  return Math.round(ttcEnCents / (1 + VAT_RATE));
}
