import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SocialConnection } from '@/lib/social/types';

vi.mock('@/lib/seo', () => ({
  absoluteUrl: (p: string) => (p.startsWith('http') ? p : `https://site${p}`),
}));

const conn: SocialConnection = {
  connected: true,
  pageId: 'PAGE',
  pageName: 'CP',
  pageAccessToken: 'PTOK',
  igUserId: 'IGU',
  igUsername: 'cp',
  connectedAt: '2026-07-02T00:00:00.000Z',
};
function jsonRes(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}
beforeEach(() => vi.unstubAllGlobals());

describe('publishPost', () => {
  it('IG carrousel : enfants → parent CAROUSEL → media_publish', async () => {
    const posted: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u: string, init?: RequestInit) => {
        posted.push(u + '|' + String(init?.body ?? ''));
        if (u.includes('/media_publish')) return jsonRes({ id: 'MEDIA' });
        if (u.includes(`/IGU/media`)) return jsonRes({ id: 'CONT' });
        if (u.includes('fields=permalink')) return jsonRes({ permalink: 'https://insta/p' });
        throw new Error('unexpected ' + u);
      })
    );
    const { publishPost } = await import('@/lib/social/publish');
    const r = await publishPost(conn, {
      imageUrls: ['/a.jpg', '/b.jpg'],
      caption: 'hello',
      toInstagram: true,
      toFacebook: false,
    });
    expect(r.errors).toEqual([]);
    expect(r.instagram?.mediaId).toBe('MEDIA');
    expect(posted.filter((p) => p.includes('is_carousel_item=true')).length).toBe(2);
    expect(posted.some((p) => p.includes('media_type=CAROUSEL'))).toBe(true);
    expect(posted.some((p) => p.includes('/media_publish'))).toBe(true);
  });

  it('FB : upload photos published=false puis /feed attached_media', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u: string) => {
        if (u.includes('/PAGE/photos')) return jsonRes({ id: 'PH' });
        if (u.includes('/PAGE/feed')) return jsonRes({ id: 'FBPOST' });
        throw new Error('unexpected ' + u);
      })
    );
    const { publishPost } = await import('@/lib/social/publish');
    const r = await publishPost(conn, {
      imageUrls: ['/a.jpg'],
      caption: 'hi',
      toInstagram: false,
      toFacebook: true,
    });
    expect(r.facebook?.postId).toBe('FBPOST');
    expect(r.errors).toEqual([]);
  });

  it('erreur Meta remontée dans errors, pas d’exception avalée', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => ({ ok: false, json: async () => ({ error: { message: 'boom' } }) }) as Response
      )
    );
    const { publishPost } = await import('@/lib/social/publish');
    const r = await publishPost(conn, {
      imageUrls: ['/a.jpg'],
      caption: 'x',
      toInstagram: true,
      toFacebook: false,
    });
    expect(r.instagram).toBeUndefined();
    expect(r.errors.join(' ')).toContain('boom');
  });
});
