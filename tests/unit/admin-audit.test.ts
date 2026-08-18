import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du Firestore Admin SDK : collection().doc().set()
const setMock = vi.fn();
const docMock = vi.fn(() => ({ set: setMock }));
const collectionMock = vi.fn(() => ({ doc: docMock }));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ collection: collectionMock })),
}));

import { writeAuditLog } from '@/lib/admin/audit';

describe('writeAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('écrit un doc dans la collection audit_log avec expiresAt à +12 mois', async () => {
    await writeAuditLog({
      actor: 'djemil.david@gmail.com',
      action: 'update',
      resourceType: 'vehicule',
      resourceId: 'peugeot-308sw',
      diff: { prix: { before: 18900, after: 17900 } },
    });

    expect(collectionMock).toHaveBeenCalledWith('audit_log');
    expect(setMock).toHaveBeenCalledTimes(1);

    const written = setMock.mock.calls[0][0];
    expect(written.actor).toBe('djemil.david@gmail.com');
    expect(written.action).toBe('update');
    expect(written.resourceType).toBe('vehicule');
    expect(written.resourceId).toBe('peugeot-308sw');
    expect(written.diff).toEqual({ prix: { before: 18900, after: 17900 } });
    expect(typeof written.timestamp).toBe('number');
    // +12 mois = 365 jours en ms
    expect(written.expiresAt.toMillis()).toBe(written.timestamp + 365 * 24 * 60 * 60 * 1000);
  });

  it("exclut le diff (PII client) quand resourceType === 'demande'", async () => {
    await writeAuditLog({
      actor: 'djemil.david@gmail.com',
      action: 'update',
      resourceType: 'demande',
      resourceId: 'dem-001',
      diff: { email: { before: 'a@b.com', after: 'c@d.com' } },
    });

    const written = setMock.mock.calls[0][0];
    expect(written.resourceType).toBe('demande');
    expect(written.resourceId).toBe('dem-001');
    expect(written.actor).toBe('djemil.david@gmail.com');
    // RGPD : pas de diff pour les demandes
    expect(written.diff).toBeUndefined();
  });

  it("n'inclut pas de clé diff quand aucun diff n'est fourni (create)", async () => {
    await writeAuditLog({
      actor: 'djemil.david@gmail.com',
      action: 'create',
      resourceType: 'vehicule',
      resourceId: 'new-veh',
    });

    const written = setMock.mock.calls[0][0];
    expect('diff' in written).toBe(false);
  });
});
