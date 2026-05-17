import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted : les factories vi.mock(...) sont hissées au top du module ;
// les mocks qu'elles référencent doivent l'être aussi (sinon ReferenceError).
const {
  requireAdminMock,
  writeAuditLogMock,
  revalidateTagMock,
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
vi.mock('next/cache', () => ({ revalidateTag: revalidateTagMock }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { createVehicule, updateVehicule, deleteVehicule } from '@/app/admin/vehicules/actions';

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

const base = {
  id: 'peugeot-308sw',
  type: 'occasion',
  marque: 'Peugeot',
  modele: '308 SW',
  annee: '2021',
  km: '42000',
  energie: 'Diesel',
  transmission: 'BVA',
  places: '5',
  options: 'Climatisation\nGPS',
  prix: '18900',
  mensualite: '289',
  image: 'https://example.com/a.webp',
  images: 'https://example.com/a.webp',
  description: 'Bon état.',
  reference: 'REF-1',
  disponibilite: 'disponible',
};

describe('Server Actions véhicules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'djemil.david@gmail.com' });
  });

  it('createVehicule : admin requis, set Firestore, audit log, revalidate', async () => {
    const res = await createVehicule(null, fd(base));
    expect(requireAdminMock).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledTimes(1);
    const written = setMock.mock.calls[0][0];
    expect(written.marque).toBe('Peugeot');
    expect(written.prix).toBe(18900);
    expect(written.options).toEqual(['Climatisation', 'GPS']);
    expect(typeof written.updatedAt).toBe('string');
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        resourceType: 'vehicule',
        resourceId: 'peugeot-308sw',
      })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('vehicules');
    expect(res).toBeUndefined(); // redirect() en succès
  });

  it('createVehicule : caracteristiques vides ne produisent pas de undefined (Firestore reject)', async () => {
    // base ne fournit aucun champ car_* → toutes les caractéristiques sont vides
    await createVehicule(null, fd(base));
    const written = setMock.mock.calls[0][0];
    // Firestore Admin SDK rejette les undefined : le doc ne doit en contenir aucun
    expect(Object.values(written.caracteristiques)).not.toContain(undefined);
    // les clés vides sont simplement absentes (pas présentes à undefined)
    expect('puissance' in written.caracteristiques).toBe(false);
  });

  it('createVehicule : Zod invalide → { errors } sans écrire', async () => {
    const res = await createVehicule(null, fd({ ...base, prix: '-1' }));
    expect(setMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: expect.objectContaining({ prix: expect.any(Array) }) });
  });

  it('createVehicule : non-admin → AdminError propagée', async () => {
    requireAdminMock.mockRejectedValue(
      Object.assign(new Error('Accès admin refusé'), { name: 'AdminError', status: 403 })
    );
    await expect(createVehicule(null, fd(base))).rejects.toMatchObject({ status: 403 });
  });

  it('updateVehicule : updatedAt concordant → update + diff audit', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, prix: 18900, updatedAt: '2026-05-01T00:00:00.000Z' }),
    });
    const res = await updateVehicule(
      null,
      fd({ ...base, prix: '17900', updatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(txUpdateMock).toHaveBeenCalled();
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'vehicule' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('vehicule:peugeot-308sw');
    expect(res).toMatchObject({ ok: true });
  });

  it('updateVehicule : conflit optimistic lock → { errors._form }', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, updatedAt: '2026-05-10T00:00:00.000Z' }),
    });
    const res = await updateVehicule(null, fd({ ...base, updatedAt: '2026-05-01T00:00:00.000Z' }));
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('deleteVehicule : soft → disponibilite vendu + audit', async () => {
    const res = await deleteVehicule('peugeot-308sw');
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ disponibilite: 'vendu' }));
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'delete', resourceType: 'vehicule' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('vehicules');
    expect(res).toMatchObject({ ok: true });
  });
});
