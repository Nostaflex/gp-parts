import { describe, it, expect, vi } from 'vitest';
import type { SocialConnection } from '@/lib/social/types';

const store = new Map<string, unknown>();
const fakeDb = {
  doc: (path: string) => ({
    get: async () => ({ exists: store.has(path), data: () => store.get(path) }),
    set: async (v: unknown) => void store.set(path, v),
    delete: async () => void store.delete(path),
  }),
  collection: () => ({ add: async () => ({ id: 'x' }) }),
};
vi.mock('@/lib/firebase-admin', () => ({ getAdminFirestore: () => fakeDb }));

const conn: SocialConnection = {
  connected: true,
  pageId: 'p1',
  pageName: 'Car Performance',
  pageAccessToken: 'TOK',
  igUserId: 'ig1',
  igUsername: 'carperf',
  connectedAt: '2026-07-02T00:00:00.000Z',
};

describe('connection storage', () => {
  it('save puis get renvoie la connexion ; clear la supprime', async () => {
    const { saveSocialConnection, getSocialConnection, clearSocialConnection } =
      await import('@/lib/social/connection');
    expect(await getSocialConnection()).toBeNull();
    await saveSocialConnection(conn);
    expect((await getSocialConnection())?.pageId).toBe('p1');
    await clearSocialConnection();
    expect(await getSocialConnection()).toBeNull();
  });
});
