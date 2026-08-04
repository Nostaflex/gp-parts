import { describe, it, expect } from 'vitest';

import {
  normalizeLocationSettings,
  DEFAULT_LOCATION_SETTINGS,
  cautionPourVoiture,
} from '@/lib/location-settings';
import { ageAtDate, yearsBetween } from '@/lib/reservations';

describe('normalizeLocationSettings', () => {
  it('null / objet vide → défauts ratifiés (21 ans, 2 ans de permis, surcharge OFF)', () => {
    expect(normalizeLocationSettings(null)).toEqual(DEFAULT_LOCATION_SETTINGS);
    expect(normalizeLocationSettings({})).toEqual(DEFAULT_LOCATION_SETTINGS);
    expect(DEFAULT_LOCATION_SETTINGS.ageMinimum).toBe(21);
    expect(DEFAULT_LOCATION_SETTINGS.permisAncienneteMinAnnees).toBe(2);
    expect(DEFAULT_LOCATION_SETTINGS.surchargeJeuneActive).toBe(false);
  });

  it('override partiel : les champs valides passent, les invalides retombent aux défauts', () => {
    const s = normalizeLocationSettings({
      ageMinimum: 23,
      permisAncienneteMinAnnees: -5, // invalide → défaut
      surchargeJeuneActive: true,
      surchargeJeuneEnCentsParJour: 1000,
      cautionsParCategorieEnCents: { SUV: 150000, Citadine: 'oops' },
    });
    expect(s.ageMinimum).toBe(23);
    expect(s.permisAncienneteMinAnnees).toBe(2);
    expect(s.surchargeJeuneActive).toBe(true);
    expect(s.surchargeJeuneEnCentsParJour).toBe(1000);
    expect(s.cautionsParCategorieEnCents.SUV).toBe(150000);
    expect(s.cautionsParCategorieEnCents.Citadine).toBe(
      DEFAULT_LOCATION_SETTINGS.cautionsParCategorieEnCents.Citadine
    );
  });

  it('âge < 18 refusé → défaut (jamais en-dessous du minimum légal)', () => {
    expect(normalizeLocationSettings({ ageMinimum: 16 }).ageMinimum).toBe(21);
  });
});

describe('cautionPourVoiture', () => {
  it('caution posée sur la voiture → prioritaire sur le défaut catégorie', () => {
    const c = cautionPourVoiture(DEFAULT_LOCATION_SETTINGS, {
      categorie: 'SUV',
      cautionEnCents: 200000,
    });
    expect(c).toBe(200000);
  });

  it('pas de caution voiture → défaut de la catégorie', () => {
    const c = cautionPourVoiture(DEFAULT_LOCATION_SETTINGS, { categorie: 'Citadine' });
    expect(c).toBe(80000);
  });
});

describe('ageAtDate / yearsBetween', () => {
  it('anniversaire pile le jour J → âge révolu compté', () => {
    expect(ageAtDate('2000-07-01', '2021-07-01')).toBe(21);
  });

  it('la veille de l’anniversaire → pas encore l’âge', () => {
    expect(ageAtDate('2000-07-02', '2021-07-01')).toBe(20);
  });

  it('yearsBetween : permis obtenu il y a exactement 2 ans → 2', () => {
    expect(yearsBetween('2097-07-01', '2099-07-01')).toBe(2);
    expect(yearsBetween('2097-07-02', '2099-07-01')).toBe(1);
  });
});
