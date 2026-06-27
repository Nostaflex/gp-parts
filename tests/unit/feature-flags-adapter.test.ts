import { describe, it, expect } from 'vitest';
import { StaticAdapter } from '@/lib/data/static';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';

describe('StaticAdapter.getFeatureFlags', () => {
  it('renvoie les défauts (dev sans Firebase)', async () => {
    const adapter = new StaticAdapter();
    await expect(adapter.getFeatureFlags()).resolves.toEqual(DEFAULT_FEATURE_FLAGS);
  });
});
