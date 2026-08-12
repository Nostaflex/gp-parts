import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/data/feature-flags-cache', () => ({
  getCachedFeatureFlags: vi.fn(),
}));
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { CpUniversStrip } from '@/components/cp/CpUniversStrip';

describe('CpUniversStrip — filtrage par flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('masque les tuiles des sections OFF, y compris vente-véhicule', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: false,
      venteVehicule: false,
      venteMoto: false,
      reparation: false,
    });
    render(await CpUniversStrip({ current: 'reparation' }));
    expect(screen.queryByText('Location')).toBeNull();
    expect(screen.queryByText('Vente véhicule')).toBeNull();
    expect(screen.getByText('Pièces détachées')).toBeInTheDocument();
  });
});
