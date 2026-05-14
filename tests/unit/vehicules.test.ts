import { describe, it, expect } from 'vitest';
import {
  VEHICULES,
  getVehiculeById,
  getAllVehiculeIds,
  getVehiculesByType,
} from '../../lib/vehicules';

/**
 * Tests unitaires sur le catalogue de véhicules.
 * Vérifie cohérence des données + helpers.
 */
describe('VEHICULES — catalogue', () => {
  it('contient au moins 1 véhicule', () => {
    expect(VEHICULES.length).toBeGreaterThan(0);
  });

  it('chaque véhicule a un id unique', () => {
    const ids = VEHICULES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque véhicule a une référence unique', () => {
    const refs = VEHICULES.map((v) => v.reference);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('chaque véhicule a 5 images', () => {
    for (const v of VEHICULES) {
      expect(v.images.length, `Véhicule ${v.id} doit avoir 5 images`).toBe(5);
    }
  });

  it('chaque véhicule a un type valide (occasion|neuf)', () => {
    for (const v of VEHICULES) {
      expect(['occasion', 'neuf']).toContain(v.type);
    }
  });

  it('chaque véhicule a un prix positif', () => {
    for (const v of VEHICULES) {
      expect(v.prix).toBeGreaterThan(0);
    }
  });

  it('chaque véhicule a une mensualité positive', () => {
    for (const v of VEHICULES) {
      expect(v.mensualite).toBeGreaterThan(0);
    }
  });

  it('véhicules neufs ont km = 0', () => {
    for (const v of VEHICULES.filter((x) => x.type === 'neuf')) {
      expect(v.km, `${v.id} neuf doit avoir 0 km`).toBe(0);
    }
  });

  it('chaque véhicule a une description non vide', () => {
    for (const v of VEHICULES) {
      expect(v.description.length).toBeGreaterThan(20);
    }
  });

  it('chaque véhicule a une disponibilité valide', () => {
    for (const v of VEHICULES) {
      expect(['disponible', 'reserve', 'vendu']).toContain(v.disponibilite);
    }
  });

  it('chaque véhicule a une énergie valide', () => {
    for (const v of VEHICULES) {
      expect(['Essence', 'Diesel', 'Hybride']).toContain(v.energie);
    }
  });
});

describe('getVehiculeById', () => {
  it('retourne le véhicule correspondant', () => {
    const first = VEHICULES[0];
    expect(getVehiculeById(first.id)).toEqual(first);
  });

  it('retourne undefined si id inconnu', () => {
    expect(getVehiculeById('nonexistent-id-xyz')).toBeUndefined();
  });
});

describe('getAllVehiculeIds', () => {
  it('retourne tous les ids', () => {
    const ids = getAllVehiculeIds();
    expect(ids.length).toBe(VEHICULES.length);
    expect(ids).toEqual(VEHICULES.map((v) => v.id));
  });
});

describe('getVehiculesByType', () => {
  it('filtre par occasion', () => {
    const occasion = getVehiculesByType('occasion');
    expect(occasion.length).toBeGreaterThan(0);
    for (const v of occasion) expect(v.type).toBe('occasion');
  });

  it('filtre par neuf', () => {
    const neuf = getVehiculesByType('neuf');
    expect(neuf.length).toBeGreaterThan(0);
    for (const v of neuf) expect(v.type).toBe('neuf');
  });

  it('occasion + neuf = total', () => {
    const occasion = getVehiculesByType('occasion');
    const neuf = getVehiculesByType('neuf');
    expect(occasion.length + neuf.length).toBe(VEHICULES.length);
  });
});
