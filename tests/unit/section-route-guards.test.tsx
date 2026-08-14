import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/data/feature-flags-cache', () => ({ getCachedFeatureFlags: vi.fn() }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { notFound } from 'next/navigation';
import ReparationPage from '@/app/reparation/page';
import LocationPage from '@/app/location/page';
import VenteVehiculePage from '@/app/vente-vehicule/page';

describe('gardes de routes section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('réparation OFF → notFound()', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: true,
      venteVehicule: true,
      venteMoto: true,
      reparation: false,
      lavage: false,
    });
    await expect(ReparationPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('location OFF → notFound()', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: false,
      venteVehicule: true,
      venteMoto: true,
      reparation: true,
      lavage: true,
    });
    await expect(LocationPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('vente véhicule OFF → notFound()', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: true,
      venteVehicule: false,
      venteMoto: true,
      reparation: true,
      lavage: true,
    });
    await expect(VenteVehiculePage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('section ON → pas de notFound (réparation rend)', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: true,
      venteVehicule: true,
      venteMoto: true,
      reparation: true,
      lavage: true,
    });
    await ReparationPage();
    expect(notFound).not.toHaveBeenCalled();
  });
});
