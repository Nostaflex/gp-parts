import { describe, it, expect } from 'vitest';

import { CRENEAUX_LAVAGE } from '@/lib/lavage-creneaux';
import {
  DEFAULT_SEMAINE_TYPE,
  jourISOde,
  normalizeSemaineType,
  prisParSemaineType,
} from '@/lib/lavage-semaine';

describe('DEFAULT_SEMAINE_TYPE', () => {
  it('lun-sam ouverts tous créneaux, dimanche fermé', () => {
    expect(DEFAULT_SEMAINE_TYPE[1].ouvert).toBe(true);
    expect(DEFAULT_SEMAINE_TYPE[6].creneaux).toEqual([...CRENEAUX_LAVAGE]);
    expect(DEFAULT_SEMAINE_TYPE[7]).toEqual({ ouvert: false, creneaux: [] });
  });
});

describe('jourISOde (UTC-safe)', () => {
  it('2026-08-16 = dimanche (7), 2026-08-17 = lundi (1)', () => {
    expect(jourISOde('2026-08-16')).toBe(7);
    expect(jourISOde('2026-08-17')).toBe(1);
  });
});

describe('normalizeSemaineType (fusion tolérante)', () => {
  it('null → défauts complets', () => {
    expect(normalizeSemaineType(null)).toEqual(DEFAULT_SEMAINE_TYPE);
  });

  it('jour partiel appliqué, créneaux inconnus ignorés, reste = défauts', () => {
    const out = normalizeSemaineType({
      jours: {
        '6': { ouvert: true, creneaux: [CRENEAUX_LAVAGE[0], '13:00 – 14:00', CRENEAUX_LAVAGE[1]] },
        '7': { ouvert: true, creneaux: [CRENEAUX_LAVAGE[2]] },
      },
    });
    expect(out[6].creneaux).toEqual([CRENEAUX_LAVAGE[0], CRENEAUX_LAVAGE[1]]);
    expect(out[7]).toEqual({ ouvert: true, creneaux: [CRENEAUX_LAVAGE[2]] });
    expect(out[1]).toEqual(DEFAULT_SEMAINE_TYPE[1]);
  });

  it('jour « ouvert » sans créneau valide → fermé de fait (jamais un jour piège)', () => {
    const out = normalizeSemaineType({ jours: { '2': { ouvert: true, creneaux: ['x'] } } });
    expect(out[2]).toEqual({ ouvert: false, creneaux: [] });
  });
});

describe('prisParSemaineType', () => {
  it('jour fermé → tous les créneaux indisponibles', () => {
    // 2026-08-16 est un dimanche — fermé par défaut.
    expect(prisParSemaineType('2026-08-16', DEFAULT_SEMAINE_TYPE)).toEqual([...CRENEAUX_LAVAGE]);
  });

  it('jour ouvert partiel → seuls les créneaux non actifs sont indisponibles', () => {
    const semaine = normalizeSemaineType({
      jours: { '1': { ouvert: true, creneaux: [CRENEAUX_LAVAGE[0], CRENEAUX_LAVAGE[1]] } },
    });
    // 2026-08-17 est un lundi.
    expect(prisParSemaineType('2026-08-17', semaine)).toEqual(CRENEAUX_LAVAGE.slice(2));
  });

  it('jour ouvert complet → rien d’indisponible', () => {
    expect(prisParSemaineType('2026-08-17', DEFAULT_SEMAINE_TYPE)).toEqual([]);
  });
});
