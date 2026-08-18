import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/emails/send', () => ({ sendReservationEmails: vi.fn() }));
vi.mock('@/lib/server/intake', () => ({
  createReservationIntake: vi.fn(async () => 'res-test'),
  createDemandeIntake: vi.fn(async () => 'dem-test'),
}));
vi.mock('@/lib/server/availability', () => ({
  getBusyRangesForCar: vi.fn(async () => []),
  getUnavailableCarIds: vi.fn(async () => []),
  getAllBusyRanges: vi.fn(async () => []),
}));

import { getAllBusyRanges } from '@/lib/server/availability';
import { getDispoParJour } from '../../app/location/actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAllBusyRanges).mockResolvedValue([]);
});

// Le parc statique (StaticAdapter) compte 6 voitures dont 5 `disponible`.
const TOTAL_DISPO = 5;

describe('getDispoParJour — bande de 6 jours du Pit Lane', () => {
  it('sans réservation : 6 jours consécutifs, tout le parc libre chaque jour', async () => {
    const jours = await getDispoParJour('2099-07-01');
    expect(jours).toHaveLength(6);
    expect(jours.map((j) => j.jour)).toEqual([
      '2099-07-01',
      '2099-07-02',
      '2099-07-03',
      '2099-07-04',
      '2099-07-05',
      '2099-07-06',
    ]);
    for (const j of jours) {
      expect(j.libres).toBe(TOTAL_DISPO);
      expect(j.total).toBe(TOTAL_DISPO);
    }
  });

  it('une voiture réservée du 02 au 04 (bornes incluses) → 1 libre de moins ces jours-là', async () => {
    vi.mocked(getAllBusyRanges).mockResolvedValue([
      { locationCarId: 'clio-v', dateDepart: '2099-07-02', dateRetour: '2099-07-04' },
    ]);
    const jours = await getDispoParJour('2099-07-01');
    expect(jours.map((j) => j.libres)).toEqual([
      TOTAL_DISPO,
      TOTAL_DISPO - 1,
      TOTAL_DISPO - 1,
      TOTAL_DISPO - 1,
      TOTAL_DISPO,
      TOTAL_DISPO,
    ]);
  });

  it('deux réservations du même véhicule le même jour ne comptent qu’une fois', async () => {
    vi.mocked(getAllBusyRanges).mockResolvedValue([
      { locationCarId: 'clio-v', dateDepart: '2099-07-02', dateRetour: '2099-07-02' },
      { locationCarId: 'clio-v', dateDepart: '2099-07-02', dateRetour: '2099-07-03' },
    ]);
    const jours = await getDispoParJour('2099-07-01');
    expect(jours[1].libres).toBe(TOTAL_DISPO - 1);
  });

  it('date invalide → refuse proprement (bande vide, pas de lecture Firestore)', async () => {
    const jours = await getDispoParJour('pas-une-date');
    expect(jours).toEqual([]);
    expect(getAllBusyRanges).not.toHaveBeenCalled();
  });
});
