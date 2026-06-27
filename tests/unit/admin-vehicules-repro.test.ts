import { describe, it, expect, vi, beforeEach } from 'vitest';

// Même harnais de mock que admin-motos-actions.test.ts.
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

import { updateVehicule } from '@/app/admin/vehicules/actions';
import { VEHICULES, type Vehicule } from '@/lib/vehicules';

/**
 * Sérialise un Vehicule en FormData EXACTEMENT comme le fait VehiculeForm
 * (composants/admin/VehiculeForm.tsx) en mode édition. C'est le payload réel
 * que reçoit la Server Action quand Stéphane clique « Enregistrer ».
 */
function vehiculeToFormData(v: Vehicule): FormData {
  const f = new FormData();
  f.append('id', v.id);
  f.append('updatedAt', v.updatedAt); // hidden, edit
  for (const url of v.images) f.append('images', url);
  f.append('marque', v.marque);
  f.append('modele', v.modele);
  f.append('type', v.type);
  f.append('reference', v.reference);
  f.append('annee', String(v.annee));
  f.append('km', String(v.km));
  f.append('energie', v.energie);
  f.append('transmission', v.transmission);
  f.append('places', String(v.places));
  f.append('prix', String(v.prix));
  f.append('mensualite', String(v.mensualite));
  f.append('disponibilite', v.disponibilite);
  f.append('description', v.description);
  f.append('options', v.options.join('\n'));
  const c = v.caracteristiques;
  if (c.puissance != null) f.append('car_puissance', c.puissance);
  if (c.cylindree != null) f.append('car_cylindree', c.cylindree);
  if (c.couleur != null) f.append('car_couleur', c.couleur);
  if (c.consommation != null) f.append('car_consommation', c.consommation);
  if (c.co2 != null) f.append('car_co2', c.co2);
  if (c.carrosserie != null) f.append('car_carrosserie', c.carrosserie);
  if (c.critAir != null) f.append('car_critair', c.critAir);
  if (c.premiereCirculation != null) f.append('car_premiere_circulation', c.premiereCirculation);
  if (c.garantie != null) f.append('car_garantie', c.garantie);
  if (c.portes != null) f.append('car_portes', String(c.portes));
  if (c.proprietaires != null) f.append('car_proprietaires', String(c.proprietaires));
  return f;
}

describe('REPRO update vehicule seed (payload réel du form)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'djemil.david@gmail.com' });
  });

  for (const v of VEHICULES) {
    it(`updateVehicule resubmit propre "${v.id}" → ok (pas d'erreur)`, async () => {
      // Le doc cloud = exactement le même véhicule (updatedAt concordant).
      txGetMock.mockResolvedValue({
        exists: true,
        data: () => ({ ...v }),
      });
      const res = await updateVehicule(null, vehiculeToFormData(v));
      // Si ça échoue, on affiche l'erreur exacte renvoyée par l'action.
      expect(res, JSON.stringify(res)).toMatchObject({ ok: true });
    });
  }
});
