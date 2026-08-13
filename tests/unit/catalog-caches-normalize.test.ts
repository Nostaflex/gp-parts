import { describe, it, expect, vi } from 'vitest';

// Même classe de bug que venteVehicule (2026-08-12) : une valeur sérialisée
// dans le data cache AVANT un changement de schéma ne doit ni casser le site
// (fail-open) ni dériver en silence (WARN). unstable_cache court-circuité.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const vehiculeValide = {
  id: 'peugeot-308sw',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '308 SW',
  annee: 2021,
  km: 45000,
  energie: 'Diesel',
  transmission: 'Manuelle',
  places: 5,
  options: ['GPS'],
  prix: 18900,
  mensualite: 280,
  image: '/images/vehicules/peugeot-308sw.jpg',
  images: ['/images/vehicules/peugeot-308sw.jpg'],
  description: 'Break familial bien entretenu.',
  caracteristiques: { puissance: '130 ch' },
  reference: 'VO-308SW',
  disponibilite: 'disponible',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

// Entrée « d'époque » : champ requis absent (sérialisée avant son ajout).
const vehiculePerime = { ...vehiculeValide, id: 'clio-v', reference: undefined };

vi.mock('@/lib/data', () => ({
  getAdapter: async () => ({
    getVehicules: async () => [vehiculeValide, vehiculePerime],
    getMotos: async () => [],
    getProducts: async () => [],
  }),
}));

import { getCachedVehicules } from '@/lib/data/vehicules-cache';

describe('caches catalogue — normalisation en sortie', () => {
  it('item conforme → parsé ; item périmé → rendu tel quel + WARN (fail-open, jamais muet)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const list = await getCachedVehicules();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('peugeot-308sw');
    // Fail-open : l'entrée non conforme n'est PAS filtrée (le site public
    // continue d'afficher le véhicule) …
    expect(list[1].id).toBe('clio-v');
    // … mais la dérive est signalée.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('non conforme');
    warn.mockRestore();
  });
});
