import { describe, it, expect } from 'vitest';

import {
  CRENEAUX_LAVAGE,
  isDateKey,
  niveauRemplissage,
  normalizeBlocages,
  prochainCreneau,
} from '@/lib/lavage-creneaux';

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

describe('prochainCreneau (raccourci Doctolib)', () => {
  const dates = ['2026-08-18', '2026-08-19', '2026-08-20'];

  it('rien de pris → premier créneau du premier jour', () => {
    expect(prochainCreneau(dates, {})).toEqual({
      date: '2026-08-18',
      creneau: CRENEAUX_LAVAGE[0],
    });
  });

  it('premier jour partiellement pris → premier créneau libre du jour', () => {
    const pris = { '2026-08-18': [CRENEAUX_LAVAGE[0], CRENEAUX_LAVAGE[1]] };
    expect(prochainCreneau(dates, pris)).toEqual({
      date: '2026-08-18',
      creneau: CRENEAUX_LAVAGE[2],
    });
  });

  it('premier jour complet → saute au jour suivant', () => {
    const pris = { '2026-08-18': [...CRENEAUX_LAVAGE] };
    expect(prochainCreneau(dates, pris)).toEqual({
      date: '2026-08-19',
      creneau: CRENEAUX_LAVAGE[0],
    });
  });

  it('tout complet → null', () => {
    const pris = Object.fromEntries(dates.map((d) => [d, [...CRENEAUX_LAVAGE]]));
    expect(prochainCreneau(dates, pris)).toBeNull();
  });
});

describe('niveauRemplissage (jauge blanche vert→orange→rouge)', () => {
  it('journée qui respire → vert', () => {
    expect(niveauRemplissage(0)).toBe('vert');
    expect(niveauRemplissage(3)).toBe('vert');
  });
  it('saturation qui arrive (≥ 4/7) → orange', () => {
    expect(niveauRemplissage(4)).toBe('orange');
    expect(niveauRemplissage(6)).toBe('orange');
  });
  it('plus de dispo → rouge', () => {
    expect(niveauRemplissage(7)).toBe('rouge');
  });
});
