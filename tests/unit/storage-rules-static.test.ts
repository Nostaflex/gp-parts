import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Garde STATIQUE des règles Storage — audit 2026-08-19 : le bucket est
// deny-all PAR CONCEPTION (écritures = Admin SDK seul, lectures = URLs à
// token ; les deux bypassent les rules). Tout `allow` réintroduit ici serait
// un chemin de contournement des gardes serveur de /api/admin/upload
// (magic-bytes, 8 Mo, anti path-traversal) — ce test doit casser si ça
// arrive, pour forcer une décision explicite.
const rules = readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf-8');

describe('storage.rules — deny-all par conception (garde statique)', () => {
  it('ne contient aucun allow autre que `if false`', () => {
    const allows = rules.match(/allow [^;]+;/g) ?? [];
    expect(allows.length).toBeGreaterThan(0); // le default deny doit exister
    for (const a of allows) {
      expect(a, `allow inattendu : « ${a} » — voir l'en-tête de storage.rules`).toMatch(
        /if false;$/
      );
    }
  });

  it('couvre tous les chemins (match global {allPaths=**})', () => {
    expect(rules).toMatch(/match \/\{allPaths=\*\*\}/);
  });
});
