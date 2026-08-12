import { describe, it, expect } from 'vitest';
import { buildCaption } from '@/lib/social/caption';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

const veh: Vehicule = {
  id: 'v1',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '208',
  annee: 2021,
  km: 30000,
  energie: 'Essence',
  transmission: 'Manuelle',
  places: 5,
  options: [],
  prix: 12900,
  mensualite: 199,
  image: '/x.jpg',
  images: ['/x.jpg'],
  description: '',
  caracteristiques: {},
  reference: 'GP-V1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};
const moto: Moto = {
  id: 'm1',
  type: 'occasion',
  marque: 'Yamaha',
  modele: 'MT-07',
  annee: 2022,
  km: 12000,
  categorie: 'Roadster',
  energie: 'Essence',
  options: [],
  prix: 6900,
  mensualite: 99,
  image: '/m.jpg',
  images: ['/m.jpg'],
  description: '',
  caracteristiques: { permis: 'A2' },
  reference: 'GP-M1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('buildCaption', () => {
  it('véhicule : contient marque, modèle, prix et hashtags', () => {
    const c = buildCaption(veh);
    expect(c).toContain('Peugeot 208');
    // Séparateur de milliers fr-FR = espace insécable étroite (U+202F) → on
    // compare avec le même formatage plutôt qu'un littéral fragile.
    expect(c).toContain((12900).toLocaleString('fr-FR'));
    expect(c).toMatch(/#Guadeloupe/);
    expect(c).toMatch(/#971/);
  });
  it('moto : contient le permis et la catégorie', () => {
    const c = buildCaption(moto);
    expect(c).toContain('Yamaha MT-07');
    expect(c).toContain('A2');
    expect(c).toContain('Roadster');
  });
});
