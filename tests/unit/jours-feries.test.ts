import { describe, it, expect } from 'vitest';

import {
  feriesPourDates,
  joursChomesUsageGuadeloupe,
  joursFeriesGuadeloupe,
} from '@/lib/jours-feries';

describe('joursFeriesGuadeloupe (12 fériés LÉGAUX, calcul local zéro API)', () => {
  it('2026 : fixes nationaux + 27 mai (abolition, L3422-2)', () => {
    const f = joursFeriesGuadeloupe(2026);
    expect(f['2026-01-01']).toBe('Jour de l’an');
    expect(f['2026-05-01']).toBe('Fête du Travail');
    expect(f['2026-05-08']).toBe('Victoire 1945');
    expect(f['2026-05-27']).toBe('Abolition de l’esclavage');
    expect(f['2026-07-14']).toBe('Fête nationale');
    expect(f['2026-08-15']).toBe('Assomption');
    expect(f['2026-11-01']).toBe('Toussaint');
    expect(f['2026-11-11']).toBe('Armistice 1918');
    expect(f['2026-12-25']).toBe('Noël');
    expect(Object.keys(f)).toHaveLength(12);
  });

  it('2026 : mobiles dérivés de Pâques (5 avril 2026)', () => {
    const f = joursFeriesGuadeloupe(2026);
    expect(f['2026-04-06']).toBe('Lundi de Pâques'); // Pâques + 1
    expect(f['2026-05-14']).toBe('Ascension'); // Pâques + 39
    expect(f['2026-05-25']).toBe('Lundi de Pentecôte'); // Pâques + 50
  });

  it('le Vendredi Saint et le 21 juillet ne sont PAS des fériés légaux', () => {
    const f = joursFeriesGuadeloupe(2026);
    expect(f['2026-04-03']).toBeUndefined();
    expect(f['2026-07-21']).toBeUndefined();
  });
});

describe('joursChomesUsageGuadeloupe (6 chômés par usage — carnaval inclus)', () => {
  it('2026 : dates vérifiées contre le calendrier publié', () => {
    const u = joursChomesUsageGuadeloupe(2026);
    expect(u['2026-02-17']).toContain('Mardi gras'); // Pâques − 47
    expect(u['2026-02-18']).toContain('Mercredi des Cendres'); // Pâques − 46
    expect(u['2026-03-12']).toContain('Mi-Carême'); // Pâques − 24
    expect(u['2026-04-03']).toContain('Vendredi Saint'); // Pâques − 2
    expect(u['2026-07-21']).toContain('Fête Victor Schœlcher');
    expect(u['2026-11-02']).toContain('Fête des Défunts');
    expect(Object.keys(u)).toHaveLength(6);
  });

  it('2025 : Pâques 20 avril — Mi-Carême le 27 mars (vérification croisée)', () => {
    const u = joursChomesUsageGuadeloupe(2025);
    expect(u['2025-03-27']).toContain('Mi-Carême');
    expect(u['2025-04-18']).toContain('Vendredi Saint');
  });

  it('chaque libellé d’usage porte la nuance « chômé par usage »', () => {
    for (const label of Object.values(joursChomesUsageGuadeloupe(2026))) {
      expect(label).toContain('(chômé par usage)');
    }
  });
});

describe('feriesPourDates (légaux ∪ usage)', () => {
  it('mélange les deux catégories sur un horizon', () => {
    const out = feriesPourDates(['2026-05-27', '2026-07-21', '2026-07-22']);
    expect(out['2026-05-27']).toBe('Abolition de l’esclavage');
    expect(out['2026-07-21']).toContain('Schœlcher');
    expect(out['2026-07-22']).toBeUndefined();
  });

  it('jamais de date hors format YYYY-MM-DD', () => {
    for (const k of Object.keys({
      ...joursFeriesGuadeloupe(2027),
      ...joursChomesUsageGuadeloupe(2027),
    })) {
      expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
