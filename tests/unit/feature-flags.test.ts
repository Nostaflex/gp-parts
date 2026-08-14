import { describe, it, expect } from 'vitest';
import { DEFAULT_FEATURE_FLAGS, normalizeFeatureFlags, isPathVisible } from '@/lib/feature-flags';

describe('feature-flags', () => {
  it('défaut = toutes sections visibles', () => {
    expect(DEFAULT_FEATURE_FLAGS).toEqual({
      pieces: true,
      location: true,
      venteVehicule: true,
      venteMoto: true,
      reparation: true,
      lavage: true,
      avis: true,
    });
  });

  it('normalize merge un doc partiel sur les défauts', () => {
    expect(normalizeFeatureFlags({ pieces: false })).toEqual({
      pieces: false,
      location: true,
      venteVehicule: true,
      venteMoto: true,
      reparation: true,
      lavage: true,
      avis: true,
    });
  });

  it('normalize gère null/undefined → défauts', () => {
    expect(normalizeFeatureFlags(null)).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(normalizeFeatureFlags(undefined)).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('normalize ignore les clés inconnues', () => {
    expect(normalizeFeatureFlags({ foo: true } as never)).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('isPathVisible : section ON visible, OFF masquée', () => {
    const flags = {
      pieces: false,
      location: true,
      venteVehicule: false,
      venteMoto: false,
      reparation: true,
      lavage: true,
      avis: true,
    };
    expect(isPathVisible('/pieces', flags)).toBe(false);
    expect(isPathVisible('/pieces?type=auto', flags)).toBe(false);
    expect(isPathVisible('/pieces/clio-4', flags)).toBe(false);
    expect(isPathVisible('/location', flags)).toBe(true);
    expect(isPathVisible('/vente-moto', flags)).toBe(false);
    expect(isPathVisible('/vente-moto/honda-pcx', flags)).toBe(false);
    expect(isPathVisible('/vente-vehicule', flags)).toBe(false);
    expect(isPathVisible('/vente-vehicule/peugeot-308', flags)).toBe(false);
    expect(isPathVisible('/reparation', flags)).toBe(true);
  });

  it('isPathVisible : routes support toujours visibles', () => {
    const allOff = {
      pieces: false,
      location: false,
      venteVehicule: false,
      venteMoto: false,
      reparation: false,
      lavage: false,
      avis: false,
    };
    expect(isPathVisible('/contact', allOff)).toBe(true);
    expect(isPathVisible('/', allOff)).toBe(true);
  });

  it('isPathVisible : /vente-moto et /vente-vehicule indépendants', () => {
    const flags = {
      pieces: true,
      location: true,
      venteVehicule: true,
      venteMoto: false,
      reparation: true,
      lavage: true,
      avis: true,
    };
    expect(isPathVisible('/vente-vehicule', flags)).toBe(true);
    expect(isPathVisible('/vente-moto', flags)).toBe(false);
  });
});

describe('feature-flags — lavage', () => {
  it('isPathVisible : /lavage gouverné par le flag lavage', () => {
    const on = { ...DEFAULT_FEATURE_FLAGS };
    const off = { ...DEFAULT_FEATURE_FLAGS, lavage: false };
    expect(isPathVisible('/lavage', on)).toBe(true);
    expect(isPathVisible('/lavage', off)).toBe(false);
  });
});
