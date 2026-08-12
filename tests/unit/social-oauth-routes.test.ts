import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ email: 'a@b.c' })),
  AdminError: class extends Error {
    status = 401;
  },
}));
// Le cookie d'état est lu via next/headers (Cookie interdit sur Request).
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (n: string) => (n === 'social_oauth_state' ? { value: 'GOOD' } : undefined),
  }),
}));
const saveMock = vi.fn(async () => {});
vi.mock('@/lib/social/connection', () => ({ saveSocialConnection: saveMock }));
vi.mock('@/lib/social/oauth', () => ({
  buildAuthUrl: (uri: string, state: string) => `https://fb/dialog?redirect=${uri}&state=${state}`,
  exchangeCodeForConnection: vi.fn(async () => ({ pageId: 'P', connected: true })),
}));

describe('callback OAuth', () => {
  it('rejette si le state ne correspond pas au cookie', async () => {
    const { GET } = await import('@/app/api/admin/social/callback/route');
    const req = new Request('https://x.app/api/admin/social/callback?code=C&state=BAD', {
      headers: { cookie: 'social_oauth_state=GOOD' },
    });
    const res = await GET(req as never);
    expect(res.headers.get('location')).toContain('error=');
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('state OK → stocke la connexion et redirige connected=1', async () => {
    const { GET } = await import('@/app/api/admin/social/callback/route');
    const req = new Request('https://x.app/api/admin/social/callback?code=C&state=GOOD', {
      headers: { cookie: 'social_oauth_state=GOOD' },
    });
    const res = await GET(req as never);
    expect(saveMock).toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('connected=1');
  });
});
