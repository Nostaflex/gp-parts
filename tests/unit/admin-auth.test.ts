import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────
const cookieGetMock = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGetMock })),
}));

const verifySessionCookieMock = vi.fn();
const getUserMock = vi.fn();
const adminDocGetMock = vi.fn();
const docMock = vi.fn(() => ({ get: adminDocGetMock }));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: vi.fn(() => ({
    verifySessionCookie: verifySessionCookieMock,
    getUser: getUserMock,
  })),
  getAdminFirestore: vi.fn(() => ({ doc: docMock })),
}));

import { requireAdmin, AdminError } from '@/lib/admin/auth';

const WHITELIST = { emails: ['djemil.david@gmail.com', 'stephane@gp-parts.com'] };

describe('requireAdmin (production)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    adminDocGetMock.mockResolvedValue({ data: () => WHITELIST });
  });

  it('throws AdminError 401 si aucun cookie __session', async () => {
    cookieGetMock.mockReturnValue(undefined);

    await expect(requireAdmin()).rejects.toMatchObject({
      name: 'AdminError',
      status: 401,
    });
  });

  it('throws AdminError 401 si le session cookie est invalide', async () => {
    cookieGetMock.mockReturnValue({ value: 'bad-cookie' });
    verifySessionCookieMock.mockRejectedValue(new Error('invalid'));

    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });

  it("throws AdminError 403 si l'email n'est pas vérifié", async () => {
    cookieGetMock.mockReturnValue({ value: 'ok-cookie' });
    verifySessionCookieMock.mockResolvedValue({
      uid: 'u1',
      email: 'djemil.david@gmail.com',
      email_verified: false,
    });

    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });

  it("throws AdminError 403 si l'email n'est pas dans la whitelist", async () => {
    cookieGetMock.mockReturnValue({ value: 'ok-cookie' });
    verifySessionCookieMock.mockResolvedValue({
      uid: 'u1',
      email: 'pirate@evil.com',
      email_verified: true,
    });

    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });

  it('retourne { uid, email } si admin whitelisté et email vérifié', async () => {
    cookieGetMock.mockReturnValue({ value: 'ok-cookie' });
    verifySessionCookieMock.mockResolvedValue({
      uid: 'u1',
      email: 'djemil.david@gmail.com',
      email_verified: true,
    });

    const result = await requireAdmin();

    expect(result).toEqual({ uid: 'u1', email: 'djemil.david@gmail.com' });
    // checkRevoked=false depuis le lot Fondations 2026-08-13 : vérification
    // cryptographique seule, fenêtre de révocation = TTL cookie (5 j).
    expect(verifySessionCookieMock).toHaveBeenCalledWith('ok-cookie', false);
  });

  it('AdminError expose message et status', () => {
    const err = new AdminError('Test', 418);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AdminError');
    expect(err.status).toBe(418);
    expect(err.message).toBe('Test');
  });
});

describe('requireAdmin (émulateur)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    adminDocGetMock.mockResolvedValue({ data: () => WHITELIST });
  });

  afterEach(() => {
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  });

  it('résout email via getUser(uid) — le cookie émulateur est un uid brut', async () => {
    cookieGetMock.mockReturnValue({ value: 'emulator-uid-123' });
    getUserMock.mockResolvedValue({
      uid: 'emulator-uid-123',
      email: 'stephane@gp-parts.com',
      emailVerified: true,
    });

    const result = await requireAdmin();

    expect(getUserMock).toHaveBeenCalledWith('emulator-uid-123');
    expect(verifySessionCookieMock).not.toHaveBeenCalled();
    expect(result).toEqual({ uid: 'emulator-uid-123', email: 'stephane@gp-parts.com' });
  });

  it('throws 403 en émulateur si uid inconnu hors whitelist', async () => {
    cookieGetMock.mockReturnValue({ value: 'unknown-uid' });
    getUserMock.mockResolvedValue({
      uid: 'unknown-uid',
      email: 'random@nowhere.com',
      emailVerified: true,
    });

    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
});
