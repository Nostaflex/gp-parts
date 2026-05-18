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

import { createMoto, updateMoto, deleteMoto } from '@/app/admin/motos/actions';

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

const base = {
  id: 'yamaha-mt07',
  type: 'occasion',
  marque: 'Yamaha',
  modele: 'MT-07',
  annee: '2022',
  km: '12500',
  categorie: 'Roadster',
  energie: 'Essence',
  options: 'ABS\nSelle confort',
  prix: '6900',
  mensualite: '109',
  image: 'https://example.com/a.webp',
  images: 'https://example.com/a.webp',
  description: 'Bon état.',
  reference: 'REF-1',
  disponibilite: 'disponible',
};

describe('Server Actions motos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'djemil.david@gmail.com' });
  });

  it('createMoto : admin requis, set Firestore, audit log, revalidate', async () => {
    const res = await createMoto(null, fd(base));
    expect(requireAdminMock).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledTimes(1);
    const written = setMock.mock.calls[0][0];
    expect(written.marque).toBe('Yamaha');
    expect(written.prix).toBe(6900);
    expect(written.options).toEqual(['ABS', 'Selle confort']);
    expect(typeof written.updatedAt).toBe('string');
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        resourceType: 'moto',
        resourceId: 'yamaha-mt07',
      })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('motos');
    expect(res).toBeUndefined(); // redirect() en succès
  });

  it('createMoto : categorie est bien écrite', async () => {
    await createMoto(null, fd(base));
    const written = setMock.mock.calls[0][0];
    expect(written.categorie).toBe('Roadster');
  });

  it('createMoto : caracteristiques vides ne produisent pas de undefined (Firestore reject)', async () => {
    // base ne fournit aucun champ car_* → toutes les caractéristiques sont vides
    await createMoto(null, fd(base));
    const written = setMock.mock.calls[0][0];
    // Firestore Admin SDK rejette les undefined : le doc ne doit en contenir aucun
    expect(Object.values(written.caracteristiques)).not.toContain(undefined);
    // les clés vides sont simplement absentes (pas présentes à undefined)
    expect('puissance' in written.caracteristiques).toBe(false);
  });

  it('createMoto : preserve caracteristiques.proprietaires (number)', async () => {
    await createMoto(null, fd({ ...base, car_proprietaires: '2' }));
    const written = setMock.mock.calls[0][0];
    expect(written.caracteristiques.proprietaires).toBe(2);
  });

  it('createMoto : car_proprietaires vide → clé absente (pas de undefined/NaN, Firestore reject)', async () => {
    await createMoto(null, fd(base)); // base ne fournit pas car_proprietaires
    const written = setMock.mock.calls[0][0];
    expect('proprietaires' in written.caracteristiques).toBe(false);
  });

  it('createMoto : Zod invalide → { errors } sans écrire', async () => {
    const res = await createMoto(null, fd({ ...base, prix: '-1' }));
    expect(setMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: expect.objectContaining({ prix: expect.any(Array) }) });
  });

  it('createMoto : non-admin → AdminError propagée', async () => {
    requireAdminMock.mockRejectedValue(
      Object.assign(new Error('Accès admin refusé'), { name: 'AdminError', status: 403 })
    );
    await expect(createMoto(null, fd(base))).rejects.toMatchObject({ status: 403 });
  });

  it('updateMoto : updatedAt concordant → update + diff audit', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, prix: 6900, updatedAt: '2026-05-01T00:00:00.000Z' }),
    });
    const res = await updateMoto(
      null,
      fd({ ...base, prix: '5900', updatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(txUpdateMock).toHaveBeenCalled();
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'moto' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('moto:yamaha-mt07');
    expect(res).toMatchObject({ ok: true });
  });

  it('updateMoto : conflit optimistic lock → { errors._form }', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ ...base, updatedAt: '2026-05-10T00:00:00.000Z' }),
    });
    const res = await updateMoto(null, fd({ ...base, updatedAt: '2026-05-01T00:00:00.000Z' }));
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(writeAuditLogMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it('deleteMoto : soft → disponibilite vendu + audit', async () => {
    const res = await deleteMoto('yamaha-mt07');
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ disponibilite: 'vendu' }));
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'delete', resourceType: 'moto' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('motos');
    expect(res).toMatchObject({ ok: true });
  });
});
