import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────
const { checkRateLimitMock } = vi.hoisted(() => ({ checkRateLimitMock: vi.fn() }));
vi.mock('@/lib/server/rate-limit', () => ({
  checkRateLimit: checkRateLimitMock,
}));

import { GET } from '@/app/api/vehicule/decode-vin/route';

describe('GET /api/vehicule/decode-vin — rate limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('429 + Retry-After quand le bucket decode-vin refuse', async () => {
    checkRateLimitMock.mockResolvedValue({ ok: false, message: 'Trop de tentatives' });

    const res = await GET(new Request('https://gp-parts.test/api/vehicule/decode-vin?vin=X'));

    expect(checkRateLimitMock).toHaveBeenCalledWith('decode-vin');
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('600');
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: 'Trop de tentatives' });
  });

  it('laisse passer (et valide le VIN) quand le limiter accepte', async () => {
    checkRateLimitMock.mockResolvedValue({ ok: true });

    // VIN absent → 400 : prouve qu'on a dépassé le garde et atteint la validation.
    const res = await GET(new Request('https://gp-parts.test/api/vehicule/decode-vin'));

    expect(res.status).toBe(400);
  });
});
