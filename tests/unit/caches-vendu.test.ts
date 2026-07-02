import { describe, it, expect, vi } from 'vitest';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

// unstable_cache passthrough : on teste la logique de filtrage, pas le cache Next.
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));

const dispo: Vehicule = {
  id: 'v-dispo',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '208',
  annee: 2021,
  km: 30000,
  energie: 'Essence',
  transmission: 'Manuelle',
  places: 5,
  options: [],
  prix: 1290000,
  mensualite: 199,
  image: '/x.jpg',
  images: ['/x.jpg'],
  description: '',
  caracteristiques: {},
  reference: 'GP-V-DISPO',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};
const vendu: Vehicule = {
  ...dispo,
  id: 'v-vendu',
  reference: 'GP-V-VENDU',
  disponibilite: 'vendu',
};

const motoDispo: Moto = {
  id: 'm-dispo',
  type: 'occasion',
  marque: 'Yamaha',
  modele: 'MT-07',
  annee: 2022,
  km: 12000,
  categorie: 'Roadster',
  energie: 'Essence',
  options: [],
  prix: 690000,
  mensualite: 99,
  image: '/m.jpg',
  images: ['/m.jpg'],
  description: '',
  caracteristiques: {},
  reference: 'GP-M-DISPO',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};
const motoVendu: Moto = {
  ...motoDispo,
  id: 'm-vendu',
  reference: 'GP-M-VENDU',
  disponibilite: 'vendu',
};

describe('getCachedVehicules — les vendus restent affichés publiquement', () => {
  it('inclut les véhicules vendus (plus de masquage)', async () => {
    vi.doMock('@/lib/data', () => ({
      getAdapter: async () => ({ getVehicules: async () => [dispo, vendu] }),
    }));
    const { getCachedVehicules } = await import('@/lib/data/vehicules-cache');
    const result = await getCachedVehicules();
    expect(result.map((v) => v.id)).toContain('v-vendu');
  });
});

describe('getCachedMotos — les vendues restent affichées publiquement', () => {
  it('inclut les motos vendues (plus de masquage)', async () => {
    vi.doMock('@/lib/data', () => ({
      getAdapter: async () => ({ getMotos: async () => [motoDispo, motoVendu] }),
    }));
    const { getCachedMotos } = await import('@/lib/data/motos-cache');
    const result = await getCachedMotos();
    expect(result.map((m) => m.id)).toContain('m-vendu');
  });
});
