import { describe, it, expect, vi, beforeEach } from 'vitest';

// Écritures verrouillées (lock optimiste sur updatedAt) : le harnais mocke la
// transaction Admin SDK — tx.get fournit l'état courant, tx.update capture.
const { txGetMock, txUpdateMock } = vi.hoisted(() => ({
  txGetMock: vi.fn(),
  txUpdateMock: vi.fn(),
}));
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ uid: 'u', email: 'a@b.gp' })),
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ get: txGetMock, update: txUpdateMock }),
  })),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { updateDemandeStatus, saveDemandeNote } from '@/app/admin/(shell)/demandes/actions';

const T0 = '2026-08-01T00:00:00.000Z';

describe('actions demandes admin (lock optimiste)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txGetMock.mockResolvedValue({ exists: true, data: () => ({ updatedAt: T0 }) });
  });

  it('updateDemandeStatus : auth + update transactionnel + audit', async () => {
    const res = await updateDemandeStatus('dem-1', 'en_cours', T0);
    expect(requireAdmin).toHaveBeenCalled();
    expect(txUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'en_cours' })
    );
    expect(writeAuditLog).toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
  });

  it('saveDemandeNote : update notes', async () => {
    const res = await saveDemandeNote('dem-1', 'rappeler après 17h', T0);
    expect(txUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ notes: 'rappeler après 17h' })
    );
    expect(res).toEqual({ ok: true });
  });

  it('conflit : updatedAt différent → refus explicite, aucune écriture ni audit', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ updatedAt: '2026-08-05T00:00:00.000Z' }),
    });
    const res = await updateDemandeStatus('dem-1', 'traitee', T0);
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(writeAuditLog).not.toHaveBeenCalled();
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining('modifiée') });
  });

  it('demande introuvable → refus explicite', async () => {
    txGetMock.mockResolvedValue({ exists: false, data: () => undefined });
    const res = await saveDemandeNote('dem-x', 'note', T0);
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ ok: false, error: expect.any(String) });
  });
});
