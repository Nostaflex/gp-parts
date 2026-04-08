import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Auth before import
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  default: {},
  db: {},
  auth: {},
}));

// Mock fetch pour les appels /api/sessionLogin et /api/sessionLogout
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { adminSignIn, adminSignOut, onAuthChange } from '@/lib/auth';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

describe('auth helpers', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('adminSignIn calls signInWithEmailAndPassword et crée le session cookie', async () => {
    const mockUser = { uid: '123', getIdToken: vi.fn().mockResolvedValue('fake-id-token') };
    const mockSignIn = vi.mocked(signInWithEmailAndPassword);
    mockSignIn.mockResolvedValueOnce({ user: mockUser } as never);

    const user = await adminSignIn('admin@gp-parts.com', 'password');

    expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), 'admin@gp-parts.com', 'password');
    expect(mockUser.getIdToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sessionLogin',
      expect.objectContaining({ method: 'POST' })
    );
    expect(user).toBe(mockUser);
  });

  it('adminSignOut appelle sessionLogout puis signOut Firebase', async () => {
    const mockSignOut = vi.mocked(signOut);
    mockSignOut.mockResolvedValueOnce(undefined);

    await adminSignOut();

    expect(mockFetch).toHaveBeenCalledWith('/api/sessionLogout', { method: 'POST' });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('onAuthChange subscribes and returns unsubscribe function', () => {
    const unsubscribeMock = vi.fn();
    const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
    mockOnAuthStateChanged.mockReturnValueOnce(unsubscribeMock);

    const callback = vi.fn();
    const unsubscribe = onAuthChange(callback);

    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(expect.anything(), callback);
    expect(unsubscribe).toBe(unsubscribeMock);
  });
});
