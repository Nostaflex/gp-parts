import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de l'Admin SDK : collection(nom).get() et collection(nom).doc(id).get()
const store: Record<string, Array<Record<string, unknown> & { id: string }>> = {};
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => ({
      get: async () => ({
        docs: (store[name] ?? []).map((d) => ({ id: d.id, data: () => d })),
      }),
      doc: (id: string) => ({
        get: async () => {
          const d = (store[name] ?? []).find((x) => x.id === id);
          return { exists: Boolean(d), id, data: () => d };
        },
      }),
    }),
  }),
}));

import {
  getLocationCarByIdAdmin,
  getLocationCarsAdmin,
  getMotosAdmin,
  getProductByIdAdmin,
  getProductsAdmin,
  getVehiculeByIdAdmin,
  getVehiculesAdmin,
} from '@/lib/admin/catalogue-server';
import { PRODUCTS } from '@/lib/products';
import { VEHICULES } from '@/lib/vehicules';
import { MOTOS } from '@/lib/motos';
import { LOCATION_CARS } from '@/lib/location-cars';

const QUAND = '2026-10-04T10:00:00.000Z';

// Le BO lit par l'Admin SDK pour voir la corbeille : les rules refusent un
// élément supprimé au SDK client (fiche d'une pièce supprimée = permission-denied).
describe('catalogue-server — lecture admin, corbeille comprise', () => {
  beforeEach(() => {
    store.products = [
      { ...PRODUCTS[0], deletedAt: null },
      { ...PRODUCTS[1], deletedAt: QUAND },
    ];
    store.vehicules = [{ ...VEHICULES[0] }, { ...VEHICULES[1], deletedAt: QUAND }];
    store.motos = [{ ...MOTOS[0], deletedAt: QUAND }];
    store['location-cars'] = [{ ...LOCATION_CARS[0], deletedAt: QUAND, updatedAt: QUAND }];
  });

  it('les listes rendent aussi les éléments supprimés, avec leur date', async () => {
    expect((await getProductsAdmin()).map((p) => p.deletedAt)).toEqual([null, QUAND]);
    expect((await getVehiculesAdmin()).map((v) => v.deletedAt ?? null)).toEqual([null, QUAND]);
    expect((await getMotosAdmin())[0].deletedAt).toBe(QUAND);
    expect((await getLocationCarsAdmin())[0].deletedAt).toBe(QUAND);
  });

  it('la fiche d’un élément supprimé se lit (elle plantait par le SDK client)', async () => {
    expect((await getProductByIdAdmin(PRODUCTS[1].id))?.deletedAt).toBe(QUAND);
    expect((await getVehiculeByIdAdmin(VEHICULES[1].id))?.deletedAt).toBe(QUAND);
    expect((await getLocationCarByIdAdmin(LOCATION_CARS[0].id))?.deletedAt).toBe(QUAND);
  });

  it('un identifiant inconnu rend null', async () => {
    expect(await getProductByIdAdmin('inconnu')).toBeNull();
    expect(await getVehiculeByIdAdmin('inconnu')).toBeNull();
  });
});
