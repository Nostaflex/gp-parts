import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/data/feature-flags-cache', () => ({
  getCachedFeatureFlags: vi.fn(),
}));
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { CpFooter } from '@/components/cp/CpFooter';

describe('CpFooter — filtrage par flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('masque liens des sections OFF (nav + groupe Pièces)', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: false,
      location: false,
      venteVehicule: false,
      venteMoto: false,
      reparation: false,
      lavage: false,
    });
    render(await CpFooter());
    expect(screen.queryByRole('link', { name: 'Réparation' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Location' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Vente moto' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Vente véhicule' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Catalogue' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Promotions' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });
});
