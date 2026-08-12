import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

// notFound() halte le rendu en levant — on reproduit ce comportement pour
// vérifier que la garde vendu 404 bien.
const notFoundError = new Error('NEXT_NOT_FOUND');
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw notFoundError;
  }),
}));

const ciStub = {
  phone: '',
  address: { city: 'Pointe-à-Pitre', postalCode: '97110', region: 'Guadeloupe' },
};
vi.mock('@/lib/data/contact-info-cache', () => ({ getCachedContactInfo: async () => ciStub }));
vi.mock('@/lib/data/feature-flags-cache', () => ({
  getCachedFeatureFlags: async () => ({ venteVehicule: true, venteMoto: true }),
}));

const vendu: Vehicule = {
  id: 'v-vendu',
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
  reference: 'GP-V-VENDU',
  disponibilite: 'vendu',
  updatedAt: '2026-07-01T00:00:00.000Z',
};
const motoVendu: Moto = {
  id: 'm-vendu',
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
  reference: 'GP-M-VENDU',
  disponibilite: 'vendu',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

vi.mock('@/lib/data/vehicules-cache', () => ({ getCachedVehicules: async () => [vendu] }));
vi.mock('@/lib/data/motos-cache', () => ({ getCachedMotos: async () => [motoVendu] }));

import { notFound } from 'next/navigation';

beforeEach(() => {
  vi.mocked(notFound).mockClear();
});

describe('Page détail — un véhicule/moto vendu retourne 404 (URL directe)', () => {
  it('véhicule vendu → notFound()', async () => {
    const Page = (await import('@/app/vente-vehicule/[id]/page')).default;
    await expect(Page({ params: Promise.resolve({ id: 'v-vendu' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFound).toHaveBeenCalled();
  });

  it('moto vendue → notFound()', async () => {
    const Page = (await import('@/app/vente-moto/[id]/page')).default;
    await expect(Page({ params: Promise.resolve({ id: 'm-vendu' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFound).toHaveBeenCalled();
  });
});
