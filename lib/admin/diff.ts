/**
 * Diff superficiel par clé pour l'audit log (Phase 4).
 * Égalité profonde via JSON pour objets/tableaux imbriqués
 * (caracteristiques, options). Suffisant : pas de fonctions ni dates
 * dans les documents véhicule.
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      diff[key] = { before: b, after: a };
    }
  }
  return diff;
}
