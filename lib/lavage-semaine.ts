// Semaine type esthétique (doc meta/lavageSemaineType) — l'étage « récurrent »
// de la console Pit Board : quels jours de semaine sont ouverts, avec quels
// créneaux. Les exceptions par date (lavageDispos) se posent PAR-DESSUS.
// Client-safe : types, défauts, normalisation — aucune dépendance Admin SDK.
import { CRENEAUX_LAVAGE } from '@/lib/lavage-creneaux';

/** Jour ISO : 1 = lundi … 7 = dimanche. */
export type JourISO = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type JourType = {
  ouvert: boolean;
  /** Créneaux actifs ce jour-là (sous-ensemble de CRENEAUX_LAVAGE). */
  creneaux: string[];
};

export type SemaineType = Record<JourISO, JourType>;

export const JOURS_ISO: readonly JourISO[] = [1, 2, 3, 4, 5, 6, 7];
export const NOMS_JOURS: Record<JourISO, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
};

// Défaut proposé (à ajuster par Stéphane au BO) : lundi-samedi ouverts sur
// tous les créneaux, dimanche fermé.
export const DEFAULT_SEMAINE_TYPE: SemaineType = Object.fromEntries(
  JOURS_ISO.map((j) => [
    j,
    j === 7 ? { ouvert: false, creneaux: [] } : { ouvert: true, creneaux: [...CRENEAUX_LAVAGE] },
  ])
) as SemaineType;

const CRENEAUX_SET: ReadonlySet<string> = new Set(CRENEAUX_LAVAGE);

/** Fusion tolérante Firestore → semaine complète. Un jour absent ou malformé
 * retombe sur son défaut ; les créneaux inconnus sont ignorés. */
export function normalizeSemaineType(raw: unknown): SemaineType {
  const jours = (raw && typeof raw === 'object' && (raw as Record<string, unknown>).jours) || null;
  const out = {} as SemaineType;
  for (const j of JOURS_ISO) {
    const item =
      jours && typeof jours === 'object' ? (jours as Record<string, unknown>)[String(j)] : null;
    if (!item || typeof item !== 'object') {
      out[j] = { ...DEFAULT_SEMAINE_TYPE[j], creneaux: [...DEFAULT_SEMAINE_TYPE[j].creneaux] };
      continue;
    }
    const d = item as Record<string, unknown>;
    const ouvert = d.ouvert === true;
    const creneaux = Array.isArray(d.creneaux)
      ? [...new Set(d.creneaux.filter((c): c is string => typeof c === 'string'))].filter((c) =>
          CRENEAUX_SET.has(c)
        )
      : [];
    // Jour « ouvert » sans aucun créneau exploitable = fermé de fait.
    out[j] =
      ouvert && creneaux.length > 0 ? { ouvert: true, creneaux } : { ouvert: false, creneaux: [] };
  }
  return out;
}

/** Jour ISO (1-7) d'une clé YYYY-MM-DD — calcul UTC, insensible au fuseau. */
export function jourISOde(date: string): JourISO {
  const js = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  return (js === 0 ? 7 : js) as JourISO;
}

/** Créneaux INDISPONIBLES d'une date selon la semaine type seule :
 * jour fermé → tous ; sinon les créneaux non actifs ce jour-là. */
export function prisParSemaineType(date: string, semaine: SemaineType): string[] {
  const jour = semaine[jourISOde(date)];
  if (!jour.ouvert) return [...CRENEAUX_LAVAGE];
  return CRENEAUX_LAVAGE.filter((c) => !jour.creneaux.includes(c));
}
