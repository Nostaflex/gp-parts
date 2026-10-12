import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Audit du 12/10/2026 (F7) : arrêté du 3 décembre 1987 art. 1 (tout prix, sur
// tout support, s'affiche TTC) ; C. conso L217-22 (la garantie commerciale ne se
// présente jamais seule, la garantie légale de conformité de 2 ans s'y ajoute) ;
// fiche DGCCRF VO (contrôle technique < 6 mois remis avant la vente).
describe('fiche véhicule — mentions légales de vente (F7)', () => {
  const src = readFileSync('app/vente-vehicule/[id]/page.tsx', 'utf8');

  it('le prix est annoncé TTC', () => {
    expect(src).toContain('>TTC</span>');
    expect(src).toContain('Financement possible, sur dossier');
  });

  it('la garantie commerciale renvoie à la garantie légale de conformité', () => {
    expect(src).toMatch(/garantie légale de conformité/i);
  });

  it('le contrôle technique est affiché quand il est renseigné au BO', () => {
    expect(src).toContain('controleTechnique');
  });
});
