import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Décision Djemil du 2026-10-05, d'après les mots de Stéphane : Car Performance
// est un « centre de maintenance et réparation automobile », pas un garage.
// Garde statique sur les textes visibles du site public (hors commentaires).
const FICHIERS = [
  'app/layout.tsx',
  'app/manifest.ts',
  'app/page.tsx',
  'app/(boutique)/pieces/layout.tsx',
  'app/a-propos/page.tsx',
  'app/mentions-legales/LegalSections.tsx',
  'components/cp/CpFooter.tsx',
  'components/cp/AvisSection.tsx',
  'lib/emails/lead.ts',
];

describe('vocabulaire du site public', () => {
  it('plus aucun texte visible ne dit « garage »', () => {
    for (const fichier of FICHIERS) {
      const fautives = readFileSync(fichier, 'utf8')
        .split('\n')
        .filter((ligne) => /garage/i.test(ligne))
        .filter((ligne) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(ligne))
        // Seule exception : le mot-clé de recherche, invisible, dans les métadonnées.
        .filter((ligne) => !(fichier === 'app/layout.tsx' && ligne.trim() === "'garage',"));
      expect(fautives, fichier).toEqual([]);
    }
  });

  it('le titre du site porte le nom choisi', () => {
    expect(readFileSync('app/layout.tsx', 'utf8')).toContain(
      'Car Performance — Centre de maintenance et réparation automobile en Guadeloupe'
    );
  });
});
