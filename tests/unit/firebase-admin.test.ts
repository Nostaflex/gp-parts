import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin/app
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock-app' })),
  getApps: vi.fn(() => []),
  cert: vi.fn((creds) => creds),
}));

// Mock firebase-admin/auth
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({ mock: 'auth-instance' })),
}));

import { getAdminAuth } from '@/lib/firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

describe('getAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset getApps to return empty (no existing apps)
    vi.mocked(getApps).mockReturnValue([]);
  });

  it('initializes app with emulator config when FIREBASE_AUTH_EMULATOR_HOST is set', () => {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-gp-parts';

    getAdminAuth();

    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'demo-gp-parts' });
    expect(getAuth).toHaveBeenCalled();

    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  });

  it('reuses existing app when already initialized', () => {
    const mockApp = { name: 'existing-app' } as any;
    vi.mocked(getApps).mockReturnValue([mockApp]);

    getAdminAuth();

    expect(initializeApp).not.toHaveBeenCalled();
    expect(getAuth).toHaveBeenCalledWith(mockApp);
  });

  it('throws when production credentials are missing', () => {
    // No emulator, no credentials
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    expect(() => getAdminAuth()).toThrow('Firebase Admin');
  });

  it('initializes with cert when production credentials are set', () => {
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    process.env.FIREBASE_ADMIN_PROJECT_ID = 'prod-project';
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'sa@prod.iam.gserviceaccount.com';
    process.env.FIREBASE_ADMIN_PRIVATE_KEY =
      '-----BEGIN RSA PRIVATE KEY-----\\nfake\\n-----END RSA PRIVATE KEY-----';

    getAdminAuth();

    expect(cert).toHaveBeenCalled();
    expect(initializeApp).toHaveBeenCalled();

    delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  });
});
