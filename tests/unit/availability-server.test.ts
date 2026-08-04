import { describe, it, expect, vi, beforeEach } from 'vitest';

// Admin SDK mocké : collection('reservations').where(...).get()
const getMock = vi.fn();
const whereMock = vi.fn(() => ({ get: getMock }));
const collectionMock = vi.fn(() => ({ where: whereMock }));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ collection: collectionMock })),
}));

import { getBusyRangesForCar, getUnavailableCarIds } from '@/lib/server/availability';

function docs(data: Array<Record<string, unknown>>) {
  return { docs: data.map((d) => ({ data: () => d })) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBusyRangesForCar', () => {
  it('renvoie les plages des réservations bloquantes de la voiture, sans PII', async () => {
    getMock.mockResolvedValueOnce(
      docs([
        {
          status: 'confirmee',
          dateDepart: '2099-07-01',
          dateRetour: '2099-07-05',
          customer: { nom: 'Dupont' },
        },
        { status: 'annulee', dateDepart: '2099-07-08', dateRetour: '2099-07-09' },
        { status: 'nouvelle', dateDepart: '2099-08-01', dateRetour: '2099-08-03' },
      ])
    );
    const ranges = await getBusyRangesForCar('clio-v');
    expect(collectionMock).toHaveBeenCalledWith('reservations');
    expect(whereMock).toHaveBeenCalledWith('locationCarId', '==', 'clio-v');
    expect(ranges).toEqual([
      { dateDepart: '2099-07-01', dateRetour: '2099-07-05' },
      { dateDepart: '2099-08-01', dateRetour: '2099-08-03' },
    ]);
    // Zéro PII dans la sortie
    for (const r of ranges) expect(Object.keys(r).sort()).toEqual(['dateDepart', 'dateRetour']);
  });

  it('fail-open : erreur Firestore → [] + console.warn (jamais muet)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getMock.mockRejectedValueOnce(new Error('boom'));
    const ranges = await getBusyRangesForCar('clio-v');
    expect(ranges).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('getUnavailableCarIds', () => {
  it('renvoie les IDs des voitures dont une réservation bloquante chevauche les dates', async () => {
    getMock.mockResolvedValueOnce(
      docs([
        {
          locationCarId: 'clio-v',
          status: 'confirmee',
          dateDepart: '2099-07-01',
          dateRetour: '2099-07-05',
        },
        {
          locationCarId: 'trafic',
          status: 'nouvelle',
          dateDepart: '2099-07-10',
          dateRetour: '2099-07-12',
        },
        {
          locationCarId: 'clio-v',
          status: 'en_cours',
          dateDepart: '2099-07-20',
          dateRetour: '2099-07-22',
        },
      ])
    );
    const ids = await getUnavailableCarIds('2099-07-04', '2099-07-06');
    expect(ids).toEqual(['clio-v']);
  });

  it('déduplique les IDs (2 réservations chevauchantes = 1 ID)', async () => {
    getMock.mockResolvedValueOnce(
      docs([
        {
          locationCarId: 'clio-v',
          status: 'confirmee',
          dateDepart: '2099-07-01',
          dateRetour: '2099-07-05',
        },
        {
          locationCarId: 'clio-v',
          status: 'nouvelle',
          dateDepart: '2099-07-05',
          dateRetour: '2099-07-08',
        },
      ])
    );
    const ids = await getUnavailableCarIds('2099-07-02', '2099-07-09');
    expect(ids).toEqual(['clio-v']);
  });

  it('fail-open : erreur Firestore → [] + console.warn', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getMock.mockRejectedValueOnce(new Error('boom'));
    const ids = await getUnavailableCarIds('2099-07-01', '2099-07-05');
    expect(ids).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
