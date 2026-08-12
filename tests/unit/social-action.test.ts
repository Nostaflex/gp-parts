import { describe, it, expect, vi } from 'vitest';

const requireAdmin = vi.fn(async () => ({ email: 'a@b.c' }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin, AdminError: class extends Error {} }));
const getConn = vi.fn();
const logMock = vi.fn(async () => {});
vi.mock('@/lib/social/connection', () => ({
  getSocialConnection: getConn,
  clearSocialConnection: vi.fn(),
  logSocialPost: logMock,
}));
const publishMock = vi.fn(async () => ({
  instagram: { mediaId: 'M', permalink: 'L' },
  errors: [],
}));
vi.mock('@/lib/social/publish', () => ({ publishPost: publishMock }));

const input = {
  itemId: 'v1',
  itemType: 'vehicule' as const,
  imageUrls: ['/a.jpg'],
  caption: 'hi',
  toInstagram: true,
  toFacebook: false,
};

describe('publishSocialPost', () => {
  it('erreur claire si non connecté', async () => {
    getConn.mockResolvedValueOnce(null);
    const { publishSocialPost } = await import('@/app/admin/reseaux-sociaux/actions');
    const r = await publishSocialPost(input);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/connect/i);
  });

  it('connecté → publie et logue', async () => {
    getConn.mockResolvedValueOnce({ connected: true, igUserId: 'IG' });
    const { publishSocialPost } = await import('@/app/admin/reseaux-sociaux/actions');
    const r = await publishSocialPost(input);
    expect(r.ok).toBe(true);
    expect(publishMock).toHaveBeenCalled();
    expect(logMock).toHaveBeenCalled();
  });
});
