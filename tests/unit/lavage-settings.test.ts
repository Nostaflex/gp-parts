import { describe, it, expect } from 'vitest';

import {
  normalizeLavageSettings,
  htFromTTCEnCents,
  serializeFormulesForSave,
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

  it('ligne inclus vide → refus avec message FRANÇAIS actionnable', () => {
    const r = LavageSettingsSchema.safeParse({
      formules: [{ ...valide.formules[0], inclus: ['Lavage main', ''] }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.map((i) => i.message).join(' ');
      expect(msg).toContain('ligne vide');
      expect(msg).not.toMatch(/Too small|expected string/);
    }
  });
});

describe('serializeFormulesForSave (bug 2026-08-16 : « l’enregistrement ne reste pas »)', () => {
  const f = {
    nom: 'Express',
    description: 'desc',
    inclus: ['Lavage main'],
    mode: 'prix' as const,
    prixTTCEnCents: 2500,
  };

  it('retour à la ligne final dans le textarea → payload valide pour le schéma', () => {
    // Le textarea BO produit ['Jantes', 'Vitres', ''] sur « Jantes\nVitres\n ».
    const payload = serializeFormulesForSave([{ ...f, inclus: ['Jantes', 'Vitres', ''] }]);
    const parsed = LavageSettingsSchema.safeParse({ formules: JSON.parse(payload) });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.formules[0].inclus).toEqual(['Jantes', 'Vitres']);
  });

  it('lignes espaces-seuls et blancs de bord retirés, reste préservé', () => {
    const payload = serializeFormulesForSave([{ ...f, inclus: ['  Jantes ', '   ', 'Vitres'] }]);
    const out = JSON.parse(payload)[0];
    expect(out.inclus).toEqual(['Jantes', 'Vitres']);
    expect(out.nom).toBe('Express');
    expect(out.prixTTCEnCents).toBe(2500);
  });
});
