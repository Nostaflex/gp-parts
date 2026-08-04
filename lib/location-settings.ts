// Réglages location : conditions conducteur + cautions par catégorie.
// Défauts ratifiés 2026-07-31 (arbitrage funnel v2) ; override BO
// (meta/locationSettings). Miroir du pattern contact-info.
import type { LocationCategorie } from '@/lib/location-cars';

export type LocationSettings = {
  ageMinimum: number; // ans révolus à la date de départ
  permisAncienneteMinAnnees: number;
  surchargeJeuneActive: boolean; // OFF v1 — préparé pour Stéphane
  surchargeJeuneEnCentsParJour: number;
  surchargeJeuneAgeMax: number; // surcharge si âge < ce seuil (quand active)
  cautionsParCategorieEnCents: Record<LocationCategorie, number>;
};

export const DEFAULT_LOCATION_SETTINGS: LocationSettings = {
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

/** Fusion tolérante Firestore → settings complets (jamais de champ manquant). */
export function normalizeLocationSettings(raw: unknown): LocationSettings {
  const d = DEFAULT_LOCATION_SETTINGS;
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const cautions = (r.cautionsParCategorieEnCents ?? {}) as Record<string, unknown>;
  return {
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
