import { describe, it, expect } from 'vitest';

import { CRENEAUX_LAVAGE, isDateKey, normalizeBlocages } from '@/lib/lavage-creneaux';

describe('isDateKey', () => {
  it('accepte YYYY-MM-DD valide, refuse le reste', () => {
    expect(isDateKey('2026-08-20')).toBe(true);
    expect(isDateKey('2026-8-20')).toBe(false);
    expect(isDateKey('2026-13-01')).toBe(false); // mois invalide
    expect(isDateKey('2026-02-30')).toBe(false); // jour invalide
    expect(isDateKey('20/08/2026')).toBe(false);
    expect(isDateKey('')).toBe(false);
    expect(isDateKey('2026-08-20T00:00:00')).toBe(false);
  });
});

describe('normalizeBlocages (fusion tolérante)', () => {
  it('null / doc vide / bloques non-liste → []', () => {
    expect(normalizeBlocages(null)).toEqual([]);
    expect(normalizeBlocages({})).toEqual([]);
    expect(normalizeBlocages({ bloques: 'x' })).toEqual([]);
  });

  it('entrées valides gardées, créneau inconnu ignoré, doublon dédoublonné', () => {
    const out = normalizeBlocages({
      bloques: [
        { creneau: CRENEAUX_LAVAGE[0], source: 'manuel' },
        { creneau: '13:00 – 14:00', source: 'manuel' }, // hors liste → ignoré
        { creneau: CRENEAUX_LAVAGE[0], source: 'rdv' }, // doublon → ignoré
        { creneau: CRENEAUX_LAVAGE[2], source: 'rdv', demandeId: 'dem-1' },
        { creneau: CRENEAUX_LAVAGE[3], source: 'invalide' }, // source inconnue → manuel
        'garbage',
      ],
    });
    expect(out).toEqual([
      { creneau: CRENEAUX_LAVAGE[0], source: 'manuel' },
      { creneau: CRENEAUX_LAVAGE[2], source: 'rdv', demandeId: 'dem-1' },
      { creneau: CRENEAUX_LAVAGE[3], source: 'manuel' },
    ]);
  });
});
