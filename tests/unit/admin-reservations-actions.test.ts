import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireAdminMock, writeAuditLogMock, revalidatePathMock, updateStatusMock, getByIdMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    writeAuditLogMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    updateStatusMock: vi.fn(),
    getByIdMock: vi.fn(),
  }));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: requireAdminMock,
  AdminError: class AdminError extends Error {},
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: writeAuditLogMock }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));
vi.mock('@/lib/data', () => ({
  getAdapter: vi.fn(async () => ({
    getReservationById: getByIdMock,
    updateReservationStatus: updateStatusMock,
  })),
}));

import { updateReservationStatus } from '@/app/admin/reservations/actions';

describe('updateReservationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@gp.fr' });
  });

  it('transition autorisée nouvelle→confirmee : update + audit', async () => {
    getByIdMock.mockResolvedValue({ id: 'r1', status: 'nouvelle' });
    const res = await updateReservationStatus('r1', 'confirmee');
    expect(updateStatusMock).toHaveBeenCalledWith('r1', 'confirmee');
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'reservation', resourceId: 'r1' })
    );
    expect(res).toMatchObject({ ok: true });
  });

  it('transition interdite nouvelle→terminee : rejet sans update', async () => {
    getByIdMock.mockResolvedValue({ id: 'r1', status: 'nouvelle' });
    const res = await updateReservationStatus('r1', 'terminee');
    expect(updateStatusMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('réservation introuvable : rejet', async () => {
    getByIdMock.mockResolvedValue(null);
    const res = await updateReservationStatus('rX', 'confirmee');
    expect(updateStatusMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('non-admin : AdminError propagée', async () => {
    requireAdminMock.mockRejectedValue(Object.assign(new Error('refusé'), { status: 403 }));
    await expect(updateReservationStatus('r1', 'confirmee')).rejects.toMatchObject({ status: 403 });
  });
});
