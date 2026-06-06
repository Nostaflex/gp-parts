import { describe, it, expect } from 'vitest';
import { isCompatibleWith, filterByVehicle, type DecodedVehicle } from '@/lib/vin-compat';
import type { Product, VehicleCompatibility } from '@/lib/types';

function makeProduct(compatibility: VehicleCompatibility[], over: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Plaquettes',
    reference: 'REF-1',
    description: '',
    shortDescription: '',
    price: 4990,
    images: [],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility,
    stock: 5,
    isPromoted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    deletedAt: null,
    ...over,
  };
}

const peugeot208: VehicleCompatibility = {
  brand: 'Peugeot',
  model: '208',
  yearFrom: 2015,
  yearTo: 2021,
};
const renaultClio: VehicleCompatibility = { brand: 'Renault', model: 'Clio IV', yearFrom: 2012 };

describe('vin-compat — isCompatibleWith', () => {
  it('match marque + année dans la plage', () => {
    const p = makeProduct([peugeot208]);
    expect(isCompatibleWith(p, { marque: 'PEUGEOT', modele: '208', annee: 2018 })).toBe(true);
  });

  it('insensible à la casse et aux accents sur la marque', () => {
    const p = makeProduct([{ brand: 'Citroën', model: 'C3', yearFrom: 2016 }]);
    expect(isCompatibleWith(p, { marque: 'citroen', modele: null, annee: 2020 })).toBe(true);
  });

  it('rejette si la marque ne correspond pas', () => {
    const p = makeProduct([peugeot208]);
    expect(isCompatibleWith(p, { marque: 'Renault', modele: 'Clio', annee: 2018 })).toBe(false);
  });

  it('rejette si année avant yearFrom', () => {
    const p = makeProduct([peugeot208]);
    expect(isCompatibleWith(p, { marque: 'Peugeot', modele: '208', annee: 2010 })).toBe(false);
  });

  it('rejette si année après yearTo', () => {
    const p = makeProduct([peugeot208]);
    expect(isCompatibleWith(p, { marque: 'Peugeot', modele: '208', annee: 2024 })).toBe(false);
  });

  it('accepte au-delà de yearFrom quand yearTo est absent (toujours en prod)', () => {
    const p = makeProduct([renaultClio]);
    expect(isCompatibleWith(p, { marque: 'Renault', modele: 'Clio', annee: 2025 })).toBe(true);
  });

  it('année inconnue (null) → ne bloque pas sur l’année', () => {
    const p = makeProduct([peugeot208]);
    expect(isCompatibleWith(p, { marque: 'Peugeot', modele: null, annee: null })).toBe(true);
  });

  it('le modèle n’est PAS bloquant (NHTSA peu fiable vs libellés FR)', () => {
    const p = makeProduct([peugeot208]);
    // modèle décodé farfelu mais marque + année OK → compatible
    expect(isCompatibleWith(p, { marque: 'Peugeot', modele: 'XYZ-CODE', annee: 2018 })).toBe(true);
  });

  it('marque absente (décodage échoué) → jamais compatible', () => {
    const p = makeProduct([peugeot208]);
    expect(isCompatibleWith(p, { marque: null, modele: null, annee: 2018 })).toBe(false);
  });

  it('une seule entrée compatibility suffit', () => {
    const p = makeProduct([peugeot208, renaultClio]);
    expect(isCompatibleWith(p, { marque: 'Renault', modele: 'Clio', annee: 2020 })).toBe(true);
  });
});

describe('vin-compat — filterByVehicle', () => {
  it('ne garde que les pièces compatibles', () => {
    const products = [
      makeProduct([peugeot208], { id: 'a' }),
      makeProduct([renaultClio], { id: 'b' }),
    ];
    const v: DecodedVehicle = { marque: 'Peugeot', modele: '208', annee: 2018 };
    const res = filterByVehicle(products, v);
    expect(res.map((p) => p.id)).toEqual(['a']);
  });

  it('véhicule non décodé (marque null) → aucun résultat', () => {
    const products = [makeProduct([peugeot208])];
    expect(filterByVehicle(products, { marque: null, modele: null, annee: null })).toHaveLength(0);
  });
});
