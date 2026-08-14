import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  requireAdminMock,
  writeAuditLogMock,
  revalidateTagMock,
  revalidatePathMock,
  setMock,
  updateMock,
  getMock,
  txGetMock,
  txUpdateMock,
  txSetMock,
  runTransactionMock,
  docMock,
  collectionMock,
} = vi.hoisted(() => {
  const setMock = vi.fn();
  const updateMock = vi.fn();
  const getMock = vi.fn();
  const txGetMock = vi.fn();
  const txUpdateMock = vi.fn();
  const txSetMock = vi.fn();
  const runTransactionMock = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({ get: txGetMock, update: txUpdateMock, set: txSetMock });
  });
  const docMock = vi.fn(() => ({ set: setMock, update: updateMock, get: getMock }));
  const collectionMock = vi.fn(() => ({ doc: docMock }));
  return {
    requireAdminMock: vi.fn(),
    writeAuditLogMock: vi.fn(),
    revalidateTagMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    setMock,
    updateMock,
    getMock,
    txGetMock,
    txUpdateMock,
    txSetMock,
    runTransactionMock,
    docMock,
    collectionMock,
  };
});

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: requireAdminMock,
  AdminError: class AdminError extends Error {
    status: number;
    constructor(m: string, s: number) {
      super(m);
      this.name = 'AdminError';
      this.status = s;
    }
  },
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: writeAuditLogMock }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({
    doc: docMock,
    collection: collectionMock,
    runTransaction: runTransactionMock,
  })),
}));
vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import {
  createLocationCar,
  updateLocationCar,
  deleteLocationCar,
} from '@/app/admin/location/actions';

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

const base = {
  id: 'clio-v',
  marque: 'Renault',
  modele: 'Clio V',
  categorie: 'Citadine',
  places: '5',
  transmission: 'Auto',
  carburant: 'Essence',
  prixJour: '45',
  prixSemaine: '270',
  disponible: 'true',
  images: 'https://example.com/clio.webp',
  reference: 'LOC-CLIO-V',
};

describe('Server Actions location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'djemil.david@gmail.com' });
  });

  it('createLocationCar : set Firestore (prix en centimes, deletedAt null), audit, revalidate', async () => {
    const res = await createLocationCar(null, fd(base));
    expect(requireAdminMock).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledTimes(1);
    const written = setMock.mock.calls[0][0];
    expect(written.marque).toBe('Renault');
    expect(written.prixJourEnCents).toBe(4500);
    expect(written.prixSemaineEnCents).toBe(27000);
    expect(written.disponible).toBe(true);
    expect(written.image).toBe('https://example.com/clio.webp');
    expect(written.deletedAt).toBeNull();
    expect(typeof written.updatedAt).toBe('string');
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        resourceType: 'location-car',
        resourceId: 'clio-v',
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/location');
    expect(res).toBeUndefined(); // redirect() en succès
  });

  it('createLocationCar : disponible=false correctement parsé', async () => {
    await createLocationCar(null, fd({ ...base, disponible: 'false' }));
    const written = setMock.mock.calls[0][0];
    expect(written.disponible).toBe(false);
  });

  it('createLocationCar : Zod invalide (prix négatif) → { errors } sans écrire', async () => {
    const res = await createLocationCar(null, fd({ ...base, prixJour: '-1' }));
    expect(setMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      errors: expect.objectContaining({ prixJourEnCents: expect.any(Array) }),
    });
  });

  it('createLocationCar : non-admin → AdminError propagée', async () => {
    requireAdminMock.mockRejectedValue(
      Object.assign(new Error('Accès admin refusé'), { name: 'AdminError', status: 403 })
    );
    await expect(createLocationCar(null, fd(base))).rejects.toMatchObject({ status: 403 });
  });

  it('updateLocationCar : updatedAt concordant → update + audit', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, prixJourEnCents: 4500, updatedAt: '2026-05-01T00:00:00.000Z' }),
    });
    const res = await updateLocationCar(
      null,
      fd({ ...base, prixJour: '50', clientUpdatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(txUpdateMock).toHaveBeenCalled();
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'location-car' })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/location');
    expect(res).toMatchObject({ ok: true });
  });

  it('updateLocationCar : conflit optimistic lock → { errors._form }', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, updatedAt: '2026-05-10T00:00:00.000Z' }),
    });
    const res = await updateLocationCar(
      null,
      fd({ ...base, clientUpdatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(writeAuditLogMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('deleteLocationCar : soft-delete verrouillé + audit', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ updatedAt: '2026-05-01T00:00:00.000Z' }),
    });
    const res = await deleteLocationCar('clio-v', '2026-05-01T00:00:00.000Z');
    expect(txUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ deletedAt: expect.any(String) })
    );
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'delete', resourceType: 'location-car' })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/location');
    expect(res).toMatchObject({ ok: true });
  });

  it('deleteLocationCar : conflit lock (édition concurrente) → refus, aucune écriture', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ updatedAt: '2026-05-10T00:00:00.000Z' }),
    });
    const res = await deleteLocationCar('clio-v', '2026-05-01T00:00:00.000Z');
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(writeAuditLogMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });
});
