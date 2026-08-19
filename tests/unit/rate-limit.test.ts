import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────
const headersGetMock = vi.fn();
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: headersGetMock })),
}));

const limitMock = vi.fn();
const ratelimitCtorMock = vi.fn();
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    class {
      limit = limitMock;
      constructor(opts: unknown) {
        ratelimitCtorMock(opts);
      }
    },
    { slidingWindow: vi.fn((max: number, window: string) => ({ max, window })) }
  ),
}));

const redisCtorMock = vi.fn();
vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(opts: unknown) {
      redisCtorMock(opts);
    }
  },
}));

const ENV_KEYS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const;

// L'état module (warned, cache des limiters) doit repartir à zéro par test.
async function freshCheckRateLimit() {
  vi.resetModules();
  const mod = await import('@/lib/server/rate-limit');
  return mod.checkRateLimit;
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of ENV_KEYS) vi.stubEnv(k, '');
    headersGetMock.mockReturnValue('203.0.113.7');
    limitMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fail-open + WARN unique quand aucun credential Redis', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const checkRateLimit = await freshCheckRateLimit();

    await expect(checkRateLimit('contact')).resolves.toEqual({ ok: true });
    await expect(checkRateLimit('contact')).resolves.toEqual({ ok: true });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('INACTIF');
    expect(ratelimitCtorMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('utilise UPSTASH_REDIS_REST_* quand présents', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://upstash.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok-upstash');
    const checkRateLimit = await freshCheckRateLimit();

    await expect(checkRateLimit('contact')).resolves.toEqual({ ok: true });

    expect(redisCtorMock).toHaveBeenCalledWith({
      url: 'https://upstash.example',
      token: 'tok-upstash',
    });
  });

  it('retombe sur KV_REST_API_* (noms injectés par le marketplace Vercel)', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
    vi.stubEnv('KV_REST_API_TOKEN', 'tok-kv');
    const checkRateLimit = await freshCheckRateLimit();

    await expect(checkRateLimit('decode-vin')).resolves.toEqual({ ok: true });

    expect(redisCtorMock).toHaveBeenCalledWith({
      url: 'https://kv.example',
      token: 'tok-kv',
    });
  });

  it('refuse avec message quand la fenêtre est dépassée', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://upstash.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok');
    limitMock.mockResolvedValue({ success: false });
    const checkRateLimit = await freshCheckRateLimit();

    const verdict = await checkRateLimit('contact');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.message).toContain('Trop de tentatives');
  });

  it('fail-open + WARN si Redis injoignable', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://upstash.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok');
    limitMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const checkRateLimit = await freshCheckRateLimit();

    await expect(checkRateLimit('contact')).resolves.toEqual({ ok: true });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
