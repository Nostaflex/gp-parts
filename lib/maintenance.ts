// lib/maintenance.ts — mode maintenance configurable au BO (meta/maintenance).
// Quand il est actif, le middleware réécrit TOUTES les pages publiques vers
// /maintenance (le BO et les webhooks restent accessibles). Isomorphe :
// utilisé par le middleware Edge (parse REST) et les pages Node.

export type MaintenanceConfig = {
  enabled: boolean;
  /** Titre affiché — vide = défaut. */
  titre: string;
  /** Message affiché — vide = défaut. */
  message: string;
};

export const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  titre: 'On prépare l’ouverture',
  message:
    'Le site Car Performance ouvre très bientôt. Pièces détachées, atelier, lavage, location et vente — tout arrive. À très vite !',
};

export function normalizeMaintenance(raw: unknown): MaintenanceConfig {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  return {
    enabled: r.enabled === true,
    titre: str(r.titre, DEFAULT_MAINTENANCE.titre),
    message: str(r.message, DEFAULT_MAINTENANCE.message),
  };
}

/**
 * Parse la réponse REST Firestore (`documents/meta/maintenance`) — le
 * middleware Edge ne peut pas charger firebase-admin. Champ absent/erreur =
 * maintenance OFF (fail-open : le site ne casse jamais à cause du flag).
 */
export function maintenanceFromRestDoc(json: unknown): MaintenanceConfig {
  const fields = (json as { fields?: Record<string, Record<string, unknown>> })?.fields;
  if (!fields) return { ...DEFAULT_MAINTENANCE };
  return normalizeMaintenance({
    enabled: fields.enabled?.booleanValue,
    titre: fields.titre?.stringValue,
    message: fields.message?.stringValue,
  });
}
