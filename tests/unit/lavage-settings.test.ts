import { describe, it, expect } from 'vitest';

import {
  normalizeLavageSettings,
  htFromTTCEnCents,
  DEFAULT_LAVAGE_SETTINGS,
} from '@/lib/lavage-settings';
import { LavageSettingsSchema } from '@/lib/schemas/lavage';

describe('normalizeLavageSettings (fusion tolérante)', () => {
  it('null / objet vide / liste vide → défauts (jamais 0 formule en public)', () => {
    expect(normalizeLavageSettings(null)).toEqual(DEFAULT_LAVAGE_SETTINGS);
    expect(normalizeLavageSettings({})).toEqual(DEFAULT_LAVAGE_SETTINGS);
    expect(normalizeLavageSettings({ formules: [] })).toEqual(DEFAULT_LAVAGE_SETTINGS);
  });

  it('items invalides filtrés, champs manquants complétés, ordre préservé', () => {
    const out = normalizeLavageSettings({
      formules: [
        { nom: 'Express', mode: 'prix', prixTTCEnCents: 2500 },
        { nom: '' }, // sans nom → filtrée
        { nom: 'Pack Complet', description: 'Tout', inclus: ['A', '', 'B'], mode: 'invalide' },
      ],
    });
    expect(out.formules).toHaveLength(2);
    expect(out.formules[0]).toEqual({
      nom: 'Express',
      description: '',
      inclus: [],
      mode: 'prix',
      prixTTCEnCents: 2500,
    });
    // mode inconnu → devis (fail-safe) ; inclus vides filtrés
    expect(out.formules[1].mode).toBe('devis');
    expect(out.formules[1].inclus).toEqual(['A', 'B']);
  });

  it('prix négatif ou non numérique → 0', () => {
    const out = normalizeLavageSettings({
      formules: [{ nom: 'X', mode: 'prix', prixTTCEnCents: -50 }],
    });
    expect(out.formules[0].prixTTCEnCents).toBe(0);
  });
});

describe('htFromTTCEnCents (TVA Guadeloupe 8,5 %)', () => {
  it('45,00 € TTC → 41,47 € HT', () => {
    expect(htFromTTCEnCents(4500)).toBe(4147);
  });
  it('0 → 0', () => {
    expect(htFromTTCEnCents(0)).toBe(0);
  });
});

describe('LavageSettingsSchema (saisie BO stricte)', () => {
  const valide = {
    formules: [
      {
        nom: 'Express',
        description: '',
        inclus: ['Lavage main'],
        mode: 'prix',
        prixTTCEnCents: 2500,
      },
    ],
  };

  it('saisie valide → OK', () => {
    expect(LavageSettingsSchema.safeParse(valide).success).toBe(true);
  });

  it('mode « prix » avec 0 € → refus explicite nommant la formule', () => {
    const r = LavageSettingsSchema.safeParse({
      formules: [{ ...valide.formules[0], prixTTCEnCents: 0 }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.message).join(' ')).toContain('Express');
    }
  });

  it('liste vide → refus (min 1)', () => {
    expect(LavageSettingsSchema.safeParse({ formules: [] }).success).toBe(false);
  });
});
