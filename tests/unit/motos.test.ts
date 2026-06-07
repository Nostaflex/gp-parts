import { describe, it, expect } from 'vitest';
import { MOTOS, getMotoById, getAllMotoIds, getMotosByType } from '../../lib/motos';

/**
 * Tests unitaires sur le catalogue de motos.
 * Vérifie cohérence des données + helpers.
 */
describe('MOTOS — catalogue', () => {
  it('contient au moins 1 moto', () => {
    expect(MOTOS.length).toBeGreaterThan(0);
  });

  it('chaque moto a un id unique', () => {
    const ids = MOTOS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque moto a une référence unique', () => {
    const refs = MOTOS.map((m) => m.reference);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('chaque moto a 1 à 5 images', () => {
    for (const m of MOTOS) {
      expect(m.images.length, `Moto ${m.id} doit avoir au moins 1 image`).toBeGreaterThanOrEqual(1);
      expect(m.images.length, `Moto ${m.id} ne doit pas dépasser 5 images`).toBeLessThanOrEqual(5);
    }
  });

  it('chaque moto a un type valide (occasion|neuf)', () => {
    for (const m of MOTOS) {
      expect(['occasion', 'neuf']).toContain(m.type);
    }
  });

  it('chaque moto a un prix positif', () => {
    for (const m of MOTOS) {
      expect(m.prix).toBeGreaterThan(0);
    }
  });

  it('chaque moto a une mensualité positive', () => {
    for (const m of MOTOS) {
      expect(m.mensualite).toBeGreaterThan(0);
    }
  });

  it('motos neuves ont km = 0', () => {
    for (const m of MOTOS.filter((x) => x.type === 'neuf')) {
      expect(m.km, `${m.id} neuf doit avoir 0 km`).toBe(0);
    }
  });

  it('chaque moto a une description non vide', () => {
    for (const m of MOTOS) {
      expect(m.description.length).toBeGreaterThan(20);
    }
  });

  it('chaque moto a une catégorie valide', () => {
    const valid = ['Roadster', 'Sport', 'Trail', 'Scooter', 'Custom', 'Routière'];
    for (const m of MOTOS) {
      expect(valid).toContain(m.categorie);
    }
  });

  it('chaque moto a un permis valide (si défini)', () => {
    const valid = ['A1', 'A2', 'A', 'AM'];
    for (const m of MOTOS) {
      if (m.caracteristiques.permis) {
        expect(valid).toContain(m.caracteristiques.permis);
      }
    }
  });

  it('chaque moto a une énergie valide', () => {
    for (const m of MOTOS) {
      expect(['Essence', 'Électrique']).toContain(m.energie);
    }
  });
});

describe('getMotoById', () => {
  it('retourne la moto correspondante', () => {
    const first = MOTOS[0];
    expect(getMotoById(first.id)).toEqual(first);
  });

  it('retourne undefined si id inconnu', () => {
    expect(getMotoById('nonexistent-id-xyz')).toBeUndefined();
  });
});

describe('getAllMotoIds', () => {
  it('retourne tous les ids', () => {
    const ids = getAllMotoIds();
    expect(ids.length).toBe(MOTOS.length);
    expect(ids).toEqual(MOTOS.map((m) => m.id));
  });
});

describe('getMotosByType', () => {
  it('filtre par occasion', () => {
    const occasion = getMotosByType('occasion');
    expect(occasion.length).toBeGreaterThan(0);
    for (const m of occasion) expect(m.type).toBe('occasion');
  });

  it('filtre par neuf', () => {
    const neuf = getMotosByType('neuf');
    expect(neuf.length).toBeGreaterThan(0);
    for (const m of neuf) expect(m.type).toBe('neuf');
  });

  it('occasion + neuf = total', () => {
    const occasion = getMotosByType('occasion');
    const neuf = getMotosByType('neuf');
    expect(occasion.length + neuf.length).toBe(MOTOS.length);
  });
});
