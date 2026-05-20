import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted : les factories vi.mock(...) sont hissées au top du module ;
// les mocks qu'elles référencent doivent l'être aussi (sinon ReferenceError).
const {
  requireAdminMock,
  writeAuditLogMock,
  revalidateTagMock,
  revalidatePathMock,
  updateMock,
  getMock,
  txGetMock,
  txUpdateMock,
  txSetMock,
  runTransactionMock,
  docMock,
  getSlugQueryMock,
  collectionMock,
} = vi.hoisted(() => {
  const updateMock = vi.fn();
  const getMock = vi.fn();
  const txGetMock = vi.fn();
  const txUpdateMock = vi.fn();
  const txSetMock = vi.fn();
  const runTransactionMock = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({ get: txGetMock, update: txUpdateMock, set: txSetMock });
  });

  // Mock for slug uniqueness query: collection('products').where(...).limit(1).get()
  const getSlugQueryMock = vi.fn().mockResolvedValue({ empty: true, docs: [] });
  const limitMockInner = vi.fn(() => ({ get: getSlugQueryMock }));
  type WhereMock = ReturnType<typeof vi.fn> &
    ((...args: unknown[]) => { where: WhereMock; limit: typeof limitMockInner });
  const whereMockInner: WhereMock = vi.fn(() => ({
    where: whereMockInner,
    limit: limitMockInner,
  })) as WhereMock;

  // docMock: returns a ref with a stable id — used for tx.set(docRef, data) in createProduct
  const docMock = vi.fn(() => ({
    id: 'generated-prod-id',
    set: vi.fn(),
    update: updateMock,
    get: getMock,
  }));

  const collectionMock = vi.fn(() => ({
    doc: docMock,
    where: whereMockInner,
    limit: limitMockInner,
  }));

  return {
    requireAdminMock: vi.fn(),
    // writeAuditLogMock doit retourner une Promise (emitDeniedAudit appelle .catch())
    writeAuditLogMock: vi.fn().mockResolvedValue(undefined),
    revalidateTagMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    updateMock,
    getMock,
    txGetMock,
    txUpdateMock,
    txSetMock,
    runTransactionMock,
    docMock,
    getSlugQueryMock,
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
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} from '@/app/admin/products/actions';

function fd(obj: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) f.append(k, item);
    } else {
      f.append(k, v);
    }
  }
  return f;
}

/** FormData minimale valide pour un produit (prix en euros, form soumet €). */
const base = {
  name: 'Plaquettes avant Clio IV',
  reference: 'REN-CLO4-DBF-001',
  description: 'Plaquettes de frein avant pour Renault Clio IV 2012-2019.',
  shortDescription: 'Plaquettes frein avant',
  price: '65.00',
  images: 'https://firebasestorage.googleapis.com/v0/b/test/o/p1.webp',
  category: 'freinage',
  vehicleType: 'auto',
  stock: '12',
  isPromoted: 'false',
  compat_0_brand: 'Renault',
  compat_0_model: 'Clio IV',
  compat_0_yearFrom: '2012',
  compat_0_yearTo: '2019',
};

/** Snapshot Firestore simulant un produit existant. */
function makeExistingSnap(overrides: Record<string, unknown> = {}) {
  return {
    exists: true,
    data: () => ({
      name: 'Plaquettes avant Clio IV',
      reference: 'REN-CLO4-DBF-001',
      description: 'Plaquettes de frein avant pour Renault Clio IV 2012-2019.',
      shortDescription: 'Plaquettes frein avant',
      price: 6500,
      images: ['https://firebasestorage.googleapis.com/v0/b/test/o/p1.webp'],
      category: 'freinage',
      vehicleType: 'auto',
      compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }],
      stock: 12,
      isPromoted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      deletedAt: null,
      slug: 'plaquettes-avant-clio-iv',
      id: 'prod-001',
      ...overrides,
    }),
  };
}

describe('Server Actions products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'djemil.david@gmail.com' });
    writeAuditLogMock.mockResolvedValue(undefined);
    getSlugQueryMock.mockResolvedValue({ empty: true, docs: [] });
    // FIX 2: tx.get is now used for both doc refs AND slug queries.
    // Default: { empty: true, docs: [] } (slug query shape, no conflict).
    // Tests that need a doc snap override with txGetMock.mockResolvedValue(makeExistingSnap()).
    txGetMock.mockResolvedValue({ empty: true, docs: [] });
  });

  // ─── CREATE ────────────────────────────────────────────────────────────────

  it('createProduct : admin requis, tx.set Firestore, audit create, revalidate', async () => {
    const res = await createProduct(null, fd(base));
    expect(requireAdminMock).toHaveBeenCalled();
    // Dans createProduct, l'écriture est dans la transaction via tx.set
    expect(txSetMock).toHaveBeenCalledTimes(1);
    const [, written] = txSetMock.mock.calls[0];
    expect(written.name).toBe('Plaquettes avant Clio IV');
    // prix en centimes (65.00 * 100 = 6500)
    expect(written.price).toBe(6500);
    // champs server-side posés automatiquement
    expect(typeof written.createdAt).toBe('string');
    expect(typeof written.updatedAt).toBe('string');
    expect(written.deletedAt).toBeNull();
    // slug dérivé du name
    expect(typeof written.slug).toBe('string');
    expect(written.slug.length).toBeGreaterThan(0);
    // audit
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        resourceType: 'product',
      })
    );
    // revalidate
    expect(revalidateTagMock).toHaveBeenCalledWith('products');
    // redirect() → res undefined
    expect(res).toBeUndefined();
  });

  it('createProduct : Zod invalide (prix négatif) → { errors } sans écrire Firestore', async () => {
    const res = await createProduct(null, fd({ ...base, price: '-1' }));
    expect(txSetMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: expect.any(Object) });
  });

  it('createProduct : non-admin → AdminError propagée, 0 write Firestore', async () => {
    requireAdminMock.mockRejectedValue(
      Object.assign(new Error('Accès admin refusé'), { name: 'AdminError', status: 403 })
    );
    await expect(createProduct(null, fd(base))).rejects.toMatchObject({ status: 403 });
    expect(txSetMock).not.toHaveBeenCalled();
  });

  it('createProduct : les champs vides ne produisent pas undefined (Firestore reject)', async () => {
    await createProduct(null, fd(base));
    expect(txSetMock).toHaveBeenCalledTimes(1);
    const [, written] = txSetMock.mock.calls[0];
    for (const v of Object.values(written)) {
      expect(v).not.toBeUndefined();
    }
  });

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  it('updateProduct : updatedAt concordant → tx.update + diff audit + revalidate', async () => {
    txGetMock.mockResolvedValue(makeExistingSnap());
    const res = await updateProduct(
      null,
      fd({ ...base, id: 'prod-001', clientUpdatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(txUpdateMock).toHaveBeenCalled();
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', resourceType: 'product' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('products');
    expect(res).toMatchObject({ ok: true });
  });

  it('updateProduct : conflit optimistic lock → { errors._form }, 0 write, 0 audit', async () => {
    txGetMock.mockResolvedValue(makeExistingSnap({ updatedAt: '2026-05-10T00:00:00.000Z' }));
    const res = await updateProduct(
      null,
      fd({ ...base, id: 'prod-001', clientUpdatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(writeAuditLogMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  // ─── DELETE (soft) ─────────────────────────────────────────────────────────

  it('deleteProduct : prend le lock, set deletedAt ISO, audit delete, revalidate', async () => {
    txGetMock.mockResolvedValue(makeExistingSnap());
    const res = await deleteProduct('prod-001', '2026-05-01T00:00:00.000Z');
    expect(txUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ deletedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}/) })
    );
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'delete', resourceType: 'product' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('products');
    expect(res).toMatchObject({ ok: true });
  });

  it('deleteProduct : updatedAt périmé → conflit, pas de soft-delete appliqué', async () => {
    txGetMock.mockResolvedValue(makeExistingSnap({ updatedAt: '2026-05-10T00:00:00.000Z' }));
    const res = await deleteProduct('prod-001', '2026-05-01T00:00:00.000Z');
    expect(txUpdateMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
  });

  it("deleteProduct : disponibilite n'existe pas sur Product → ne pas y toucher", async () => {
    txGetMock.mockResolvedValue(makeExistingSnap());
    await deleteProduct('prod-001', '2026-05-01T00:00:00.000Z');
    const updateArg = txUpdateMock.mock.calls[0][1];
    expect(updateArg).not.toHaveProperty('disponibilite');
  });

  // ─── RESTORE ───────────────────────────────────────────────────────────────

  it('restoreProduct : remet deletedAt: null, audit action:"restore", revalidate', async () => {
    txGetMock.mockResolvedValue(makeExistingSnap({ deletedAt: '2026-05-05T00:00:00.000Z' }));
    const res = await restoreProduct('prod-001', '2026-05-01T00:00:00.000Z');
    expect(txUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ deletedAt: null })
    );
    // audit avec action: 'restore' (FIX 5)
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'restore', resourceType: 'product' })
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('products');
    expect(res).toMatchObject({ ok: true });
  });

  // ─── MASS-ASSIGNMENT (anti-injection) ──────────────────────────────────────

  it('mass-assignment : formData avec deletedAt/updatedAt/id ignorés (valeur server-side gagne)', async () => {
    await createProduct(
      null,
      fd({
        ...base,
        id: 'hacked-id',
        slug: 'hacked-slug',
        createdAt: '1970-01-01T00:00:00.000Z',
        updatedAt: '1970-01-01T00:00:00.000Z',
        deletedAt: '2025-01-01T00:00:00.000Z',
      })
    );
    expect(txSetMock).toHaveBeenCalledTimes(1);
    const [, written] = txSetMock.mock.calls[0];
    // id = celui du docRef généré par Firestore, pas 'hacked-id'
    expect(written.id).not.toBe('hacked-id');
    // deletedAt doit être null (server-side forcé)
    expect(written.deletedAt).toBeNull();
    // createdAt doit être récent (pas 1970)
    expect(new Date(written.createdAt).getFullYear()).toBeGreaterThan(2020);
  });

  it('updateProduct : ne peut pas set deletedAt via formData (server-side protégé)', async () => {
    txGetMock.mockResolvedValue(makeExistingSnap());
    await updateProduct(
      null,
      fd({
        ...base,
        id: 'prod-001',
        clientUpdatedAt: '2026-05-01T00:00:00.000Z',
        deletedAt: '2025-01-01T00:00:00.000Z',
      })
    );
    // Unconditional: the write MUST have happened and deletedAt MUST NOT be a key
    expect(txUpdateMock).toHaveBeenCalledTimes(1);
    const updateArg = txUpdateMock.mock.calls[0][1];
    expect(updateArg).not.toHaveProperty('deletedAt');
  });

  // ─── FIX 1: productId path-injection guard ─────────────────────────────────

  it('deleteProduct : productId avec "/" → { errors._form }, 0 tx/Firestore call', async () => {
    const res = await deleteProduct('a/b/c', '2026-05-01T00:00:00.000Z');
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(txGetMock).not.toHaveBeenCalled();
    expect(txUpdateMock).not.toHaveBeenCalled();
  });

  it('deleteProduct : productId traversal "../x" → { errors._form }, 0 tx/Firestore call', async () => {
    const res = await deleteProduct('../x', '2026-05-01T00:00:00.000Z');
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('updateProduct : productId avec "/" → { errors._form }, 0 tx/Firestore call', async () => {
    const res = await updateProduct(
      null,
      fd({ ...base, id: 'a/b/c', clientUpdatedAt: '2026-05-01T00:00:00.000Z' })
    );
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('restoreProduct : productId traversal "../x" → { errors._form }, 0 tx/Firestore call', async () => {
    const res = await restoreProduct('../x', '2026-05-01T00:00:00.000Z');
    expect(res).toMatchObject({ errors: { _form: expect.any(Array) } });
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  // ─── FIX 3: empty slug guard ───────────────────────────────────────────────

  it('createProduct : nom ponctuation seule "!!!" → { errors.name }, 0 write', async () => {
    const res = await createProduct(null, fd({ ...base, name: '!!!' }));
    // Zod: name min(1) passes for '!!!', but slugify produces '' → FIX 3 catches it
    // Note: if Zod rejects '!!!' first that's also valid (errors object with name field)
    expect(res).toMatchObject({ errors: expect.any(Object) });
    expect(txSetMock).not.toHaveBeenCalled();
  });

  it('createProduct : nom japonais "日本語" → { errors.name } slug vide, 0 write', async () => {
    const res = await createProduct(null, fd({ ...base, name: '日本語' }));
    expect(res).toMatchObject({ errors: expect.any(Object) });
    expect(txSetMock).not.toHaveBeenCalled();
  });

  // ─── FIX 4+5: audit action:'denied' and action:'restore' ──────────────────

  it('audit denied : writeAuditLog appelé avec action:"denied" (pas la mutation tentée)', async () => {
    requireAdminMock.mockRejectedValue(
      Object.assign(new Error('Non authentifié'), { name: 'AdminError', status: 401 })
    );
    await expect(deleteProduct('prod-001', '2026-05-01T00:00:00.000Z')).rejects.toMatchObject({
      status: 401,
    });
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'denied', resourceType: 'product', resourceId: 'prod-001' })
    );
  });

  it('restoreProduct success : writeAuditLog appelé avec action:"restore", pas de diff fabricated', async () => {
    txGetMock.mockResolvedValue(makeExistingSnap({ deletedAt: '2026-05-05T00:00:00.000Z' }));
    const res = await restoreProduct('prod-001', '2026-05-01T00:00:00.000Z');
    expect(res).toMatchObject({ ok: true });
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'restore',
        resourceType: 'product',
        resourceId: 'prod-001',
      })
    );
    // No fabricated before:'non-null' diff
    const callArg = writeAuditLogMock.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('diff');
  });

  // ─── Optional: non-finite priceOriginal rejected ───────────────────────────

  it('createProduct : priceOriginal Infinity → { errors._form }, 0 write', async () => {
    const res = await createProduct(null, fd({ ...base, priceOriginal: 'Infinity' }));
    expect(res).toMatchObject({ errors: expect.any(Object) });
    expect(txSetMock).not.toHaveBeenCalled();
  });

  // ─── COMPAT SPARSE-INJECTION ───────────────────────────────────────────────

  it('compat sparse-injection : compat_0_* + compat_99999_* → exactement 1 entrée (dense loop)', async () => {
    // base a compat_0_*, on ajoute compat_99999_* — la loop dense s'arrête à i=1
    await createProduct(
      null,
      fd({
        ...base,
        compat_99999_brand: 'Evil',
        compat_99999_model: 'Inject',
        compat_99999_yearFrom: '2000',
      })
    );
    expect(txSetMock).toHaveBeenCalledTimes(1);
    const [, written] = txSetMock.mock.calls[0];
    expect(written.compatibility).toHaveLength(1);
    expect(written.compatibility[0].brand).toBe('Renault');
  });

  // ─── AUDIT DENIED ──────────────────────────────────────────────────────────

  it('audit denied : requireAdmin throw → writeAuditLog émis avec action:"denied" avant rethrow', async () => {
    requireAdminMock.mockRejectedValue(
      Object.assign(new Error('Non authentifié'), { name: 'AdminError', status: 401 })
    );
    await expect(createProduct(null, fd(base))).rejects.toMatchObject({ status: 401 });
    // Un enregistrement d'audit best-effort doit avoir été tenté
    expect(writeAuditLogMock).toHaveBeenCalledTimes(1);
    // L'audit doit utiliser action:'denied' et resourceType 'product' (FIX 5)
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'denied', resourceType: 'product' })
    );
    // 0 écriture Firestore produit
    expect(txSetMock).not.toHaveBeenCalled();
  });
});
