import { describe, it, expect, vi } from 'vitest';

// unstable_cache court-circuité : on teste la normalisation EN SORTIE de
// cache — une valeur sérialisée avant l'ajout d'un flag (data cache .next/
// ou Vercel) ne doit jamais masquer une section à tort (vécu venteVehicule).
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

// Valeur « d'époque » : sérialisée avant l'existence de venteVehicule.
const staleFlags = { pieces: true, location: true, venteMoto: true, reparation: true };
const staleContactInfo = { phone: '+590690112233' };

vi.mock('@/lib/data', () => ({
  getAdapter: async () => ({
    getFeatureFlags: async () => staleFlags,
    getContactInfo: async () => staleContactInfo,
  }),
}));

import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';

describe('caches — normalisation en sortie (valeurs sérialisées anciennes)', () => {
  it('flag absent du cache → défaut appliqué, jamais undefined', async () => {
    const flags = await getCachedFeatureFlags();
    expect(flags.venteVehicule).toBe(true);
    expect(flags.pieces).toBe(true);
  });

  it('champ contact absent du cache → défaut appliqué', async () => {
    const ci = await getCachedContactInfo();
    expect(ci.phone).toBe('+590690112233');
    expect(ci.social).toEqual(DEFAULT_CONTACT_INFO.social);
  });
});
