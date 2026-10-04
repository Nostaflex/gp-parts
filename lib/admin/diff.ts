/**
 * Diff superficiel par clé pour l'audit log (Phase 4).
 * Égalité profonde via JSON pour objets/tableaux imbriqués
 * (caracteristiques, options). Suffisant : pas de fonctions ni dates
 * dans les documents véhicule.
 *
 * Limites assumées (sans impact sur les données véhicule réelles) :
 * suppose l'ordre des clés d'objet stable (faux positif sinon) et
 * aucun `undefined` dans les tableaux (normalisé en null par JSON).
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

/**
 * Diff d'une mise à jour PARTIELLE (`tx.update` = fusion) : seules les clés du
 * patch peuvent avoir changé. Les champs du document absents du formulaire
 * (deletedAt, createdAt…) ne sont pas « supprimés » : les comparer produisait
 * `after: undefined`, que Firestore refuse à l'écriture de l'audit — l'audit
 * des pièces échouait en silence, la modification d'une voiture de location
 * levait une erreur après l'enregistrement.
 */
export function computePatchDiff(
  before: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const concerne = Object.fromEntries(Object.keys(patch).map((key) => [key, before[key]]));
  return computeDiff(concerne, patch);
}
