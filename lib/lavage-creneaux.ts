// Créneaux esthétique automobile + disponibilités (doc lavageDispos/{date}).
// Client-safe : types, constantes et normalisation — aucune dépendance Admin SDK.

/** Créneaux proposés à la prise de RDV esthétique (source canonique — le
 * formulaire public et la grille BO consomment cette liste). */
export const CRENEAUX_LAVAGE = [
  '08:00 – 09:00',
  '09:00 – 10:00',
  '10:00 – 11:00',
  '11:00 – 12:00',
  '14:00 – 15:00',
  '15:00 – 16:00',
  '16:00 – 17:00',
] as const;

/** Horizon de gestion des disponibilités (jours) — borne les écritures BO et
 * les requêtes publiques : jamais de doc au-delà. */
export const DISPO_HORIZON_JOURS = 60;

export type LavageBlocageSource = 'manuel' | 'rdv';

export type LavageBlocage = {
  /** Libellé du créneau — doit appartenir à CRENEAUX_LAVAGE. */
  creneau: string;
  /** 'manuel' = bloqué par Stéphane (absence…) ; 'rdv' = réservé pour une demande. */
  source: LavageBlocageSource;
  /** Id de la demande à l'origine d'un blocage 'rdv'. */
  demandeId?: string;
};

/** Créneaux PRIS par date (libellés) — la forme servie par l'API publique. */
export type PrisParDate = Record<string, string[]>;

/** Raccourci « Prochain créneau » (pattern Doctolib) : premier créneau libre
 * en parcourant les dates dans l'ordre. null = tout l'horizon est complet. */
export function prochainCreneau(
  dates: string[],
  pris: PrisParDate
): { date: string; creneau: string } | null {
  for (const date of dates) {
    const occupes = new Set(pris[date] ?? []);
    for (const creneau of CRENEAUX_LAVAGE) {
      if (!occupes.has(creneau)) return { date, creneau };
    }
  }
  return null;
}

/** Niveau de la jauge de remplissage (décision Djemil 2026-08-16) :
 * vert = la journée respire, orange = la saturation arrive (≥ 4/7),
 * rouge = plus de dispo. */
export function niveauRemplissage(
  nPris: number,
  total: number = CRENEAUX_LAVAGE.length
): 'vert' | 'orange' | 'rouge' {
  if (nPris >= total) return 'rouge';
  if (nPris / total >= 0.5) return 'orange';
  return 'vert';
}

/** Clé de date d'un doc lavageDispos : YYYY-MM-DD strict. Parse en UTC pour
 * que la validation ne dépende jamais du fuseau du serveur (leçon TZ
 * Guadeloupe UTC−4) ; « 2026-02-30 » glisse en mars → refusé. */
export function isDateKey(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

const CRENEAUX_SET: ReadonlySet<string> = new Set(CRENEAUX_LAVAGE);

/** Fusion tolérante Firestore → blocages exploitables. Une entrée inconnue ou
 * malformée est ignorée (jamais de crash côté public), un créneau dupliqué est
 * dédoublonné (première entrée gagnante). */
export function normalizeBlocages(raw: unknown): LavageBlocage[] {
  if (!raw || typeof raw !== 'object') return [];
  const list = (raw as Record<string, unknown>).bloques;
  if (!Array.isArray(list)) return [];
  const out: LavageBlocage[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const b = item as Record<string, unknown>;
    const creneau = typeof b.creneau === 'string' ? b.creneau : '';
    if (!CRENEAUX_SET.has(creneau) || seen.has(creneau)) continue;
    seen.add(creneau);
    out.push({
      creneau,
      source: b.source === 'rdv' ? 'rdv' : 'manuel',
      ...(typeof b.demandeId === 'string' && b.demandeId ? { demandeId: b.demandeId } : {}),
    });
  }
  return out;
}
