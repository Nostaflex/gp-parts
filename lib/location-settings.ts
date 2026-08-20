// Réglages location : conditions conducteur + cautions par catégorie.
// Défauts ratifiés 2026-07-31 (arbitrage funnel v2) ; override BO
// (meta/locationSettings). Miroir du pattern contact-info.
import type { LocationCategorie } from '@/lib/location-cars';

/** Narration de Max sur la Loca Lane — TOUT est administrable (spec gelée
 * 2026-08-20, même mécanique que la narration de Splash). Gabarits
 * {depart} {retour} {jours} {vehicule} {alternative} {dispo} remplacés au
 * rendu ; champ vide → texte par défaut. */
export type LocationNarration = {
  acte1SansDepart: string;
  acte1VoeuSansDepart: string; // {vehicule}
  acte1ChoixRetour: string; // {depart}
  acte1CorrectionDepart: string;
  acte1Complet: string; // {jours}
  acte1LongSejour: string; // ≥ 7 j — {jours}
  acte1PlageMorte: string; // {depart} {retour}
  acte1Carrefour: string; // {vehicule} {depart} {retour} {alternative}
  acte1CarrefourSansAlt: string; // {vehicule}
  acte2: string; // {depart}
  acte2Rarete: string; // {dispo}
  acte2VoeuPris: string; // {vehicule}
  acte3: string;
  noteDefaut: string;
  noteUtilitaire: string;
  noteLongue: string;
};

export const DEFAULT_LOCATION_NARRATION: LocationNarration = {
  acte1SansDepart:
    'D’abord, dis-moi QUAND tu pars. Les barres, c’est l’état réel du parc — et pour corriger une date, tape simplement son champ.',
  acte1VoeuSansDepart:
    'Le {vehicule} te fait de l’œil ? Noté — les barres te montrent SES disponibilités. Clique ton jour de départ.',
  acte1ChoixRetour: 'Le {depart}, c’est noté. Et le retour ? Clique le jour où tu rends les clés.',
  acte1CorrectionDepart: 'On corrige le départ — clique le nouveau jour, le retour ne bouge pas.',
  acte1Complet:
    'Départ blanc, retour orange — {jours} jours. Choisis tes heures et on va voir le parc.',
  acte1LongSejour:
    'Une semaine ou plus : Basse-Terre, Grande-Terre, et il te reste du carburant pour la Pointe des Châteaux.',
  acte1PlageMorte: 'Là, tout le parc est pris quelque part entre le {depart} et le {retour}.',
  acte1Carrefour:
    'Ton {vehicule} est pris du {depart} au {retour}. Le {alternative} est libre sur TES dates — on part avec lui ?',
  acte1CarrefourSansAlt:
    'Ton {vehicule} est pris sur ces dates, et aucun autre véhicule ne colle exactement — on regarde tout le parc ?',
  acte2:
    'Pour ton départ du {depart} : voilà ce qui est au local, avec le prix de TA plage — pas de surprise à la fin.',
  acte2Rarete:
    'Il ne reste que {dispo} véhicules sur ta plage. Je ne te promets pas qu’ils seront encore là ce soir.',
  acte2VoeuPris:
    'Ton {vehicule} est pris sur ces dates — il reste visible en rouge, avec sa date de retour. Glisse d’un tap, ou prends une autre monture.',
  acte3:
    'Empreinte CB, état des lieux photo, quinze minutes de paperasse. Je te confirme sur WhatsApp avant la fin de la journée.',
  noteDefaut: 'Km illimité et assurance déjà comptés. Rien à ajouter au retour.',
  noteUtilitaire: 'Trois mètres cubes : un déménagement d’étudiant tient dedans.',
  noteLongue: 'Km illimité — c’est au bout de cinq jours qu’on comprend pourquoi.',
};

export type LocationSettings = {
  ageMinimum: number; // ans révolus à la date de départ
  permisAncienneteMinAnnees: number;
  surchargeJeuneActive: boolean; // OFF v1 — préparé pour Stéphane
  surchargeJeuneEnCentsParJour: number;
  surchargeJeuneAgeMax: number; // surcharge si âge < ce seuil (quand active)
  cautionsParCategorieEnCents: Record<LocationCategorie, number>;
  narration: LocationNarration;
};

export const DEFAULT_LOCATION_SETTINGS: LocationSettings = {
  narration: DEFAULT_LOCATION_NARRATION,
  ageMinimum: 21,
  permisAncienneteMinAnnees: 2,
  surchargeJeuneActive: false,
  surchargeJeuneEnCentsParJour: 0,
  surchargeJeuneAgeMax: 25,
  cautionsParCategorieEnCents: {
    Citadine: 80000,
    Berline: 100000,
    SUV: 120000,
    Utilitaire: 120000,
  },
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Narration Firestore → complète. Champ vide ou absent = texte par défaut
 * (la bulle de Max n'est jamais muette). */
function normalizeNarration(raw: unknown): LocationNarration {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_LOCATION_NARRATION };
  for (const k of Object.keys(out) as (keyof LocationNarration)[]) {
    const v = typeof src[k] === 'string' ? (src[k] as string).trim() : '';
    if (v) out[k] = v;
  }
  return out;
}

/** Fusion tolérante Firestore → settings complets (jamais de champ manquant). */
export function normalizeLocationSettings(raw: unknown): LocationSettings {
  const d = DEFAULT_LOCATION_SETTINGS;
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const cautions = (r.cautionsParCategorieEnCents ?? {}) as Record<string, unknown>;
  return {
    narration: normalizeNarration(r.narration),
    ageMinimum: isNum(r.ageMinimum) && r.ageMinimum >= 18 ? Math.floor(r.ageMinimum) : d.ageMinimum,
    permisAncienneteMinAnnees:
      isNum(r.permisAncienneteMinAnnees) && r.permisAncienneteMinAnnees >= 0
        ? Math.floor(r.permisAncienneteMinAnnees)
        : d.permisAncienneteMinAnnees,
    surchargeJeuneActive: r.surchargeJeuneActive === true,
    surchargeJeuneEnCentsParJour:
      isNum(r.surchargeJeuneEnCentsParJour) && r.surchargeJeuneEnCentsParJour >= 0
        ? Math.round(r.surchargeJeuneEnCentsParJour)
        : d.surchargeJeuneEnCentsParJour,
    surchargeJeuneAgeMax:
      isNum(r.surchargeJeuneAgeMax) && r.surchargeJeuneAgeMax >= 18
        ? Math.floor(r.surchargeJeuneAgeMax)
        : d.surchargeJeuneAgeMax,
    cautionsParCategorieEnCents: {
      Citadine: isNum(cautions.Citadine)
        ? Math.round(cautions.Citadine as number)
        : d.cautionsParCategorieEnCents.Citadine,
      Berline: isNum(cautions.Berline)
        ? Math.round(cautions.Berline as number)
        : d.cautionsParCategorieEnCents.Berline,
      SUV: isNum(cautions.SUV)
        ? Math.round(cautions.SUV as number)
        : d.cautionsParCategorieEnCents.SUV,
      Utilitaire: isNum(cautions.Utilitaire)
        ? Math.round(cautions.Utilitaire as number)
        : d.cautionsParCategorieEnCents.Utilitaire,
    },
  };
}

/** Caution applicable : celle de la voiture si posée, sinon défaut catégorie. */
export function cautionPourVoiture(
  settings: LocationSettings,
  car: { categorie: LocationCategorie; cautionEnCents?: number }
): number {
  return car.cautionEnCents != null && car.cautionEnCents >= 0
    ? car.cautionEnCents
    : settings.cautionsParCategorieEnCents[car.categorie];
}
