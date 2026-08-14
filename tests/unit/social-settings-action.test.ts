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
import { updateSocialSettings } from '@/app/admin/(shell)/posts-sociaux/actions';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

describe('updateSocialSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('écrit le doc, audit', async () => {
    const res = await updateSocialSettings(
      null,
      fd({ defaultHashtags: '#CP #971', signature: 'Car Performance' })
    );
    expect(requireAdmin).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultHashtags: '#CP #971',
        signature: 'Car Performance',
        updatedBy: 'admin@test.gp',
      }),
      { merge: true }
    );
    expect(writeAuditLog).toHaveBeenCalled();
    expect(res?.ok).toBe(true);
  });
});
