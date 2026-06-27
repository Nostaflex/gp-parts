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

  it('masque les tuiles des sections OFF, garde vente-véhicule', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: false,
      location: false,
      venteMoto: false,
      reparation: false,
    });
    render(await CpUniversStrip({ current: 'reparation' }));
    expect(screen.queryByText('Pièces détachées')).toBeNull();
    expect(screen.queryByText('Location')).toBeNull();
    expect(screen.getByText('Vente véhicule')).toBeInTheDocument();
  });
});
