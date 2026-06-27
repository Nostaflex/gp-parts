import { describe, it, expect, vi, beforeEach } from 'vitest';

const setMock = vi.fn(async () => undefined);
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ uid: 'u1', email: 'admin@test.gp' })),
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ doc: () => ({ set: setMock }) })),
}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { revalidateTag } from 'next/cache';
import { toggleFeatureFlags } from '@/app/admin/(shell)/parametres/actions';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

describe('toggleFeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('écrit le doc, audit, revalide', async () => {
    const res = await toggleFeatureFlags(
      null,
      fd({ pieces: 'on', location: '', venteMoto: 'on', reparation: '' })
    );
    expect(requireAdmin).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pieces: true,
        location: false,
        venteMoto: true,
        reparation: false,
        updatedBy: 'admin@test.gp',
      }),
      { merge: true }
    );
    expect(writeAuditLog).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith('feature-flags');
    expect(res).toEqual({ ok: true, message: expect.any(String) });
  });

  it('refuse sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Non authentifié'));
    await expect(toggleFeatureFlags(null, fd({}))).rejects.toThrow('Non authentifié');
    expect(setMock).not.toHaveBeenCalled();
  });
});
