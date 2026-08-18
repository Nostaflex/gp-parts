import { describe, it, expect } from 'vitest';
import { normalizeLegalInfo, LegalInfoSchema, DEFAULT_LEGAL_INFO } from '@/lib/legal-info';

describe('legal-info — fiche contribuable BO (A6)', () => {
  it('normalize : null/undefined → défauts vides (jamais de zéros)', () => {
    expect(normalizeLegalInfo(null)).toEqual(DEFAULT_LEGAL_INFO);
    expect(normalizeLegalInfo(undefined)).toEqual(DEFAULT_LEGAL_INFO);
  });

  it('normalize : trim + champs non-string neutralisés', () => {
    expect(
      normalizeLegalInfo({
        tvaIntracom: '  FR12102854023 ',
        mediateurNom: 'CM2C',
        // @ts-expect-error — un doc Firestore corrompu ne doit pas passer
        mediateurUrl: 42,
        rcPro: '',
      })
    ).toEqual({
      tvaIntracom: 'FR12102854023',
      mediateurNom: 'CM2C',
      mediateurUrl: '',
      rcPro: '',
    });
  });

  it('schema : URL du médiateur validée, vide accepté', () => {
    expect(
      LegalInfoSchema.safeParse({ ...DEFAULT_LEGAL_INFO, mediateurUrl: 'https://cm2c.net' }).success
    ).toBe(true);
    expect(LegalInfoSchema.safeParse(DEFAULT_LEGAL_INFO).success).toBe(true);
    expect(
      LegalInfoSchema.safeParse({ ...DEFAULT_LEGAL_INFO, mediateurUrl: 'pas-une-url' }).success
    ).toBe(false);
  });
});
