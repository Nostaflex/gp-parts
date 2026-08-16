import { describe, it, expect } from 'vitest';

import { joursFeriesGuadeloupe } from '@/lib/jours-feries';

describe('joursFeriesGuadeloupe (calcul local, zéro API)', () => {
  it('2026 : fixes nationaux + spécifiques Guadeloupe', () => {
    const f = joursFeriesGuadeloupe(2026);
    expect(f['2026-01-01']).toBe('Jour de l’an');
    expect(f['2026-05-01']).toBe('Fête du Travail');
    expect(f['2026-05-08']).toBe('Victoire 1945');
    expect(f['2026-07-14']).toBe('Fête nationale');
    expect(f['2026-08-15']).toBe('Assomption');
    expect(f['2026-11-01']).toBe('Toussaint');
    expect(f['2026-11-11']).toBe('Armistice 1918');
    expect(f['2026-12-25']).toBe('Noël');
    // Spécifiques Guadeloupe
    expect(f['2026-05-27']).toBe('Abolition de l’esclavage');
    expect(f['2026-07-21']).toBe('Fête Victor Schœlcher');
  });

  it('2026 : mobiles dérivés de Pâques (5 avril 2026)', () => {
    const f = joursFeriesGuadeloupe(2026);
    expect(f['2026-04-03']).toBe('Vendredi Saint'); // Pâques − 2
    expect(f['2026-04-06']).toBe('Lundi de Pâques'); // Pâques + 1
    expect(f['2026-05-14']).toBe('Ascension'); // Pâques + 39
    expect(f['2026-05-25']).toBe('Lundi de Pentecôte'); // Pâques + 50
  });

  it('2025 : Pâques 20 avril — vérification croisée du computus', () => {
    const f = joursFeriesGuadeloupe(2025);
    expect(f['2025-04-18']).toBe('Vendredi Saint');
    expect(f['2025-04-21']).toBe('Lundi de Pâques');
    expect(f['2025-05-29']).toBe('Ascension');
    expect(f['2025-06-09']).toBe('Lundi de Pentecôte');
  });

  it('jamais de date hors format YYYY-MM-DD', () => {
    for (const k of Object.keys(joursFeriesGuadeloupe(2027))) {
      expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
