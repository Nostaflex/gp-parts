import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireAdminMock, writeAuditLogMock, revalidatePathMock, transitionMock } = vi.hoisted(
  () => ({
    requireAdminMock: vi.fn(),
    writeAuditLogMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    transitionMock: vi.fn(),
  })
);

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: requireAdminMock,
  AdminError: class AdminError extends Error {},
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: writeAuditLogMock }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));
vi.mock('@/lib/admin/reservations-server', () => ({
  transitionReservationStatusAdmin: transitionMock,
}));

import { updateReservationStatus } from '@/app/admin/reservations/actions';

describe('updateReservationStatus (transition transactionnelle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@gp.fr' });
  });

  it('transition autorisée nouvelle→confirmee : transaction + audit', async () => {
    transitionMock.mockResolvedValue({ ok: true });
    const res = await updateReservationStatus('r1', 'confirmee');
    expect(transitionMock).toHaveBeenCalledWith('r1', 'confirmee', expect.any(Object));
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'reservation', resourceId: 'r1' })
    );
    expect(res).toMatchObject({ ok: true });
  });

  it('transition interdite : rejet sans audit', async () => {
    transitionMock.mockResolvedValue({ ok: false, reason: 'transition', current: 'nouvelle' });
    const res = await updateReservationStatus('r1', 'terminee');
    expect(writeAuditLogMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('réservation introuvable : rejet', async () => {
    transitionMock.mockResolvedValue({ ok: false, reason: 'introuvable' });
    const res = await updateReservationStatus('rX', 'confirmee');
    expect(writeAuditLogMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('non-admin : AdminError propagée', async () => {
    requireAdminMock.mockRejectedValue(Object.assign(new Error('refusé'), { status: 403 }));
    await expect(updateReservationStatus('r1', 'confirmee')).rejects.toMatchObject({ status: 403 });
  });
});
