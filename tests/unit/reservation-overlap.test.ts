import { describe, it, expect } from 'vitest';

import { rangesOverlap, BLOCKING_STATUSES } from '@/lib/reservations';

describe('rangesOverlap', () => {
  it('disjoint : avant / après → false', () => {
    expect(rangesOverlap('2099-07-01', '2099-07-05', '2099-07-06', '2099-07-10')).toBe(false);
    expect(rangesOverlap('2099-07-06', '2099-07-10', '2099-07-01', '2099-07-05')).toBe(false);
  });

  it('chevauchement partiel → true', () => {
    expect(rangesOverlap('2099-07-01', '2099-07-05', '2099-07-04', '2099-07-10')).toBe(true);
    expect(rangesOverlap('2099-07-04', '2099-07-10', '2099-07-01', '2099-07-05')).toBe(true);
  });

  it('plage incluse dans l’autre → true', () => {
    expect(rangesOverlap('2099-07-01', '2099-07-10', '2099-07-03', '2099-07-04')).toBe(true);
    expect(rangesOverlap('2099-07-03', '2099-07-04', '2099-07-01', '2099-07-10')).toBe(true);
  });

  it('bord commun (retour = départ suivant) → true (inclusif, pas de rotation même-jour en v1)', () => {
    expect(rangesOverlap('2099-07-01', '2099-07-05', '2099-07-05', '2099-07-08')).toBe(true);
  });

  it('plages identiques → true', () => {
    expect(rangesOverlap('2099-07-01', '2099-07-05', '2099-07-01', '2099-07-05')).toBe(true);
  });
});

describe('BLOCKING_STATUSES', () => {
  it('bloque nouvelle/confirmee/en_cours, libère terminee/annulee', () => {
    expect(BLOCKING_STATUSES).toEqual(['nouvelle', 'confirmee', 'en_cours']);
    expect(BLOCKING_STATUSES).not.toContain('terminee');
    expect(BLOCKING_STATUSES).not.toContain('annulee');
  });
});
