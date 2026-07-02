import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('META_APP_ID', 'APPID');
vi.stubEnv('META_APP_SECRET', 'SECRET');

function jsonRes(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('buildAuthUrl', () => {
  it('inclut client_id, redirect_uri, state, scope', async () => {
    const { buildAuthUrl } = await import('@/lib/social/oauth');
    const url = buildAuthUrl('https://x.app/cb', 'STATE123');
    expect(url).toContain('client_id=APPID');
    expect(url).toContain('state=STATE123');
    expect(url).toContain('instagram_content_publish');
    expect(url).toContain(encodeURIComponent('https://x.app/cb'));
  });
});

describe('exchangeCodeForConnection', () => {
  it('enchaîne short→long token→page→IG et renvoie la connexion', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u: string) => {
        calls.push(u);
        if (u.includes('/oauth/access_token') && u.includes('code='))
          return jsonRes({ access_token: 'SHORT' });
        if (u.includes('fb_exchange_token')) return jsonRes({ access_token: 'LONG' });
        if (u.includes('/me/accounts'))
          return jsonRes({
            data: [{ id: 'PAGE1', name: 'Car Performance', access_token: 'PAGETOK' }],
          });
        if (u.includes('instagram_business_account'))
          return jsonRes({ instagram_business_account: { id: 'IG1', username: 'carperf' } });
        throw new Error('unexpected ' + u);
      })
    );
    const { exchangeCodeForConnection } = await import('@/lib/social/oauth');
    const conn = await exchangeCodeForConnection(
      'CODE',
      'https://x.app/cb',
      '2026-07-02T00:00:00.000Z'
    );
    expect(conn.pageId).toBe('PAGE1');
    expect(conn.pageAccessToken).toBe('PAGETOK');
    expect(conn.igUserId).toBe('IG1');
    expect(conn.igUsername).toBe('carperf');
  });
});
