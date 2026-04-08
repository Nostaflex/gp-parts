import { describe, it, expect, vi } from 'vitest';

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

import { adminSignIn, adminSignOut, onAuthChange } from '@/lib/auth';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

describe('auth helpers', () => {
  it('adminSignIn calls signInWithEmailAndPassword', async () => {
    const mockSignIn = vi.mocked(signInWithEmailAndPassword);
    mockSignIn.mockResolvedValueOnce({ user: { uid: '123' } } as never);

    await adminSignIn('admin@gp-parts.com', 'password');
    expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), 'admin@gp-parts.com', 'password');
  });

  it('adminSignOut calls signOut', async () => {
    const mockSignOut = vi.mocked(signOut);
    mockSignOut.mockResolvedValueOnce(undefined);

    await adminSignOut();
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
