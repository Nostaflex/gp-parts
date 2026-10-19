import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/data/feature-flags-cache', () => ({ getCachedFeatureFlags: vi.fn() }));
vi.mock('@/lib/data/vehicules-cache', () => ({ getCachedVehicules: vi.fn() }));
vi.mock('@/lib/data/motos-cache', () => ({ getCachedMotos: vi.fn() }));
vi.mock('@/lib/data', () => ({
  getAdapter: vi.fn(async () => ({
    getProducts: async () => [
      {
        id: 'p1',
        slug: 'plaquettes-clio-iv',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-09-30T10:00:00.000Z',
      },
    ],
  })),
}));

import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { getCachedVehicules } from '@/lib/data/vehicules-cache';
import { getCachedMotos } from '@/lib/data/motos-cache';
import sitemap from '@/app/sitemap';

const ALL_ON = {
  pieces: true,
  location: true,
  venteVehicule: true,
  venteMoto: true,
  reparation: true,
  lavage: true,
  avis: true,
};

/**
 * Lot 1 SEO (P1.3 de l'audit du 19/08) : le sitemap est l'inventaire réel,
 * sans URL privée, sans facette, sans fiche vendue (404), daté par updatedAt.
 */
describe('sitemap — inventaire réel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCachedFeatureFlags).mockResolvedValue(ALL_ON);
    vi.mocked(getCachedVehicules).mockResolvedValue([
      { id: 'bmw-x1-2023', disponibilite: 'disponible', updatedAt: '2026-10-01T08:00:00.000Z' },
      { id: 'renault-clio', disponibilite: 'reserve', updatedAt: '2026-09-15T08:00:00.000Z' },
      { id: 'vehicule-vendu', disponibilite: 'vendu', updatedAt: '2026-09-01T08:00:00.000Z' },
    ] as never);
    vi.mocked(getCachedMotos).mockResolvedValue([
      {
        id: 'yamaha-mt07-2022',
        disponibilite: 'disponible',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
      { id: 'moto-vendue', disponibilite: 'vendu', updatedAt: '2026-09-02T08:00:00.000Z' },
    ] as never);
  });

  it('ne contient ni /panier ni URL avec paramètres (facettes UX non indexables)', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/panier'))).toBe(false);
    expect(urls.some((u) => u.includes('?'))).toBe(false);
  });

  it('véhicules et motos viennent de l’inventaire, sans les vendus', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/vente-vehicule/bmw-x1-2023'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/vente-vehicule/renault-clio'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/vente-vehicule/vehicule-vendu'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/vente-moto/yamaha-mt07-2022'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/vente-moto/moto-vendue'))).toBe(false);
    // Plus aucune fiche de la liste statique historique.
    expect(urls.some((u) => u.endsWith('/vente-vehicule/peugeot-308sw'))).toBe(false);
  });

  it('les dates viennent de updatedAt ; les pages statiques ne sont pas datées « maintenant »', async () => {
    const entries = await sitemap();
    const vehicule = entries.find((e) => e.url.endsWith('/vente-vehicule/bmw-x1-2023'));
    expect(vehicule?.lastModified).toEqual(new Date('2026-10-01T08:00:00.000Z'));
    const product = entries.find((e) => e.url.endsWith('/pieces/plaquettes-clio-iv'));
    expect(product?.lastModified).toEqual(new Date('2026-09-30T10:00:00.000Z'));
    const home = entries.find((e) => e.url.endsWith('/') && !e.url.endsWith('//'));
    expect(home?.lastModified).toBeUndefined();
  });

  it('sections OFF : leurs fiches disparaissent aussi', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({ ...ALL_ON, venteMoto: false });
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.includes('/vente-moto'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/vente-vehicule/bmw-x1-2023'))).toBe(true);
  });
});
