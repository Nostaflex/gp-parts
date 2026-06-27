import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/data/feature-flags-cache', () => ({ getCachedFeatureFlags: vi.fn() }));
vi.mock('@/lib/data', () => ({
  getAdapter: vi.fn(async () => ({
    getProducts: async () => [],
  })),
}));

import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import sitemap from '@/app/sitemap';

describe('sitemap — filtrage par flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exclut les URLs des sections OFF, garde vente-véhicule', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: false,
      location: false,
      venteMoto: false,
      reparation: false,
    });
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/pieces'))).toBe(false);
    expect(urls.some((u) => u.includes('/location'))).toBe(false);
    expect(urls.some((u) => u.includes('/reparation'))).toBe(false);
    expect(urls.some((u) => u.includes('/vente-moto'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/vente-vehicule'))).toBe(true);
  });

  it('tout ON → conserve les sections', async () => {
    vi.mocked(getCachedFeatureFlags).mockResolvedValue({
      pieces: true,
      location: true,
      venteMoto: true,
      reparation: true,
    });
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/pieces'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/location'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/reparation'))).toBe(true);
  });
});
