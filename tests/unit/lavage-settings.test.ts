import { describe, it, expect } from 'vitest';

import {
  normalizeLavageSettings,
  htFromTTCEnCents,
  serializeFormulesForSave,
  DEFAULT_LAVAGE_SETTINGS,
} from '@/lib/lavage-settings';
import { LavageSettingsSchema } from '@/lib/schemas/lavage';

describe('DEFAULT_LAVAGE_SETTINGS (gamme Stéphane 2026-08-16)', () => {
  it('Premium Wash, Ultimate Wash et forfait Pick-up & Utilitaire, tarifs exacts', () => {
    const noms = DEFAULT_LAVAGE_SETTINGS.formules.map((f) => f.nom);
    expect(noms).toEqual(['Premium Wash', 'Ultimate Wash', 'Pick-up & Utilitaire']);
    const [premium, ultimate, pickup] = DEFAULT_LAVAGE_SETTINGS.formules;
    expect(premium.tarifs).toEqual([
      { label: 'Citadine', prixTTCEnCents: 3000 },
      { label: 'Gamme B', prixTTCEnCents: 5000 },
      { label: 'SUV', prixTTCEnCents: 9000 },
    ]);
    expect(ultimate.tarifs).toEqual([
      { label: 'Citadine', prixTTCEnCents: 5000 },
      { label: 'Gamme B', prixTTCEnCents: 8000 },
      { label: 'SUV', prixTTCEnCents: 12000 },
    ]);
    expect(pickup.tarifs).toEqual([{ label: 'Forfait', prixTTCEnCents: 11000 }]);
  });

  it('les défauts passent le schéma strict du BO (sinon la 1re sauvegarde échouerait)', () => {
    expect(LavageSettingsSchema.safeParse(DEFAULT_LAVAGE_SETTINGS).success).toBe(true);
  });
});

describe('normalizeLavageSettings (fusion tolérante)', () => {
  it('null / objet vide / liste vide → défauts (jamais 0 formule en public)', () => {
    expect(normalizeLavageSettings(null)).toEqual(DEFAULT_LAVAGE_SETTINGS);
    expect(normalizeLavageSettings({})).toEqual(DEFAULT_LAVAGE_SETTINGS);
    expect(normalizeLavageSettings({ formules: [] })).toEqual(DEFAULT_LAVAGE_SETTINGS);
  });

  it('items invalides filtrés, tarifs invalides retirés, ordre préservé', () => {
    const out = normalizeLavageSettings({
      formules: [
        {
          nom: 'Express',
          tarifs: [
            { label: 'Citadine', prixTTCEnCents: 2500 },
            { label: '', prixTTCEnCents: 900 }, // sans libellé → retiré
            { label: 'SUV', prixTTCEnCents: -5 }, // prix invalide → retiré
          ],
        },
        { nom: '' }, // sans nom → filtrée
        { nom: 'Pack', description: 'Tout', inclus: ['A', '', 'B'] },
      ],
    });
    expect(out.formules).toHaveLength(2);
    expect(out.formules[0]).toEqual({
      nom: 'Express',
      description: '',
      inclus: [],
      tarifs: [{ label: 'Citadine', prixTTCEnCents: 2500 }],
    });
    // sans tarifs → liste vide (« Sur devis ») ; inclus vides filtrés
    expect(out.formules[1].tarifs).toEqual([]);
    expect(out.formules[1].inclus).toEqual(['A', 'B']);
  });

  it('legacy v1 (mode prix, tarif unique) → migré en un tarif', () => {
    const out = normalizeLavageSettings({
      formules: [
        { nom: 'X', mode: 'prix', prixTTCEnCents: 4500 },
        { nom: 'Y', mode: 'devis', prixTTCEnCents: 0 },
      ],
    });
    expect(out.formules[0].tarifs).toEqual([{ label: 'Tarif', prixTTCEnCents: 4500 }]);
    expect(out.formules[1].tarifs).toEqual([]);
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
        tarifs: [{ label: 'Citadine', prixTTCEnCents: 2500 }],
      },
    ],
  };

  it('saisie valide → OK ; sans tarifs (« Sur devis ») → OK aussi', () => {
    expect(LavageSettingsSchema.safeParse(valide).success).toBe(true);
    expect(
      LavageSettingsSchema.safeParse({
        formules: [{ ...valide.formules[0], tarifs: [] }],
      }).success
    ).toBe(true);
  });

  it('tarif à 0 € → refus explicite nommant la formule et le gabarit', () => {
    const r = LavageSettingsSchema.safeParse({
      formules: [
        {
          ...valide.formules[0],
          tarifs: [{ label: 'SUV', prixTTCEnCents: 0 }],
        },
      ],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.map((i) => i.message).join(' ');
      expect(msg).toContain('Express');
      expect(msg).toContain('SUV');
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
    tarifs: [{ label: 'Citadine', prixTTCEnCents: 2500 }],
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
    expect(out.tarifs).toEqual([{ label: 'Citadine', prixTTCEnCents: 2500 }]);
  });

  it('ligne de tarif entièrement vide retirée ; libellés trimés', () => {
    const payload = serializeFormulesForSave([
      {
        ...f,
        tarifs: [
          { label: '  SUV ', prixTTCEnCents: 9000 },
          { label: '', prixTTCEnCents: 0 }, // ligne vide (juste ajoutée) → retirée
        ],
      },
    ]);
    const out = JSON.parse(payload)[0];
    expect(out.tarifs).toEqual([{ label: 'SUV', prixTTCEnCents: 9000 }]);
  });

  it('ligne de tarif à moitié remplie CONSERVÉE (le schéma doit la signaler, pas la perdre)', () => {
    const payload = serializeFormulesForSave([
      { ...f, tarifs: [{ label: 'SUV', prixTTCEnCents: 0 }] },
    ]);
    expect(JSON.parse(payload)[0].tarifs).toEqual([{ label: 'SUV', prixTTCEnCents: 0 }]);
  });
});
