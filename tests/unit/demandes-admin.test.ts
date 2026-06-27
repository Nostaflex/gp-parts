import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateMock = vi.fn(async () => undefined);
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ uid: 'u', email: 'a@b.gp' })),
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({
    collection: () => ({ doc: () => ({ update: updateMock }) }),
  })),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { updateDemandeStatus, saveDemandeNote } from '@/app/admin/(shell)/demandes/actions';

describe('actions demandes admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateDemandeStatus : auth + update + audit', async () => {
    await updateDemandeStatus('dem-1', 'en_cours');
    expect(requireAdmin).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'en_cours' }));
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it('saveDemandeNote : update notes', async () => {
    await saveDemandeNote('dem-1', 'rappeler après 17h');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'rappeler après 17h' })
    );
  });
});
