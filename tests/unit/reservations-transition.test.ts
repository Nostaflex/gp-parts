import { describe, it, expect, vi, beforeEach } from 'vitest';

// La garde anti-TOCTOU elle-même : lecture + garde + écriture dans UNE
// transaction — la garde est réévaluée sur l'état courant, pas l'état lu avant.
const { txGetMock, txUpdateMock } = vi.hoisted(() => ({
  txGetMock: vi.fn(),
  txUpdateMock: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ get: txGetMock, update: txUpdateMock }),
  })),
}));
vi.mock('@/lib/schemas/reservation', () => ({ parseReservation: (d: unknown) => d }));

import { transitionReservationStatusAdmin } from '@/lib/admin/reservations-server';
import type { ReservationStatus } from '@/lib/reservations';

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee'],
  terminee: [],
  annulee: [],
};

describe('transitionReservationStatusAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('état courant compatible → écrit', async () => {
    txGetMock.mockResolvedValue({ exists: true, data: () => ({ status: 'nouvelle' }) });
    const res = await transitionReservationStatusAdmin('r1', 'confirmee', TRANSITIONS);
    expect(res).toEqual({ ok: true });
    expect(txUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'confirmee' })
    );
  });

  it("TOCTOU : l'état a changé entre la lecture de l'écran et le clic → refus", async () => {
    // L'admin voyait « nouvelle », mais un autre admin a déjà annulé.
    txGetMock.mockResolvedValue({ exists: true, data: () => ({ status: 'annulee' }) });
    const res = await transitionReservationStatusAdmin('r1', 'confirmee', TRANSITIONS);
    expect(res).toEqual({ ok: false, reason: 'transition', current: 'annulee' });
    expect(txUpdateMock).not.toHaveBeenCalled();
  });

  it('introuvable → refus sans écriture', async () => {
    txGetMock.mockResolvedValue({ exists: false, data: () => undefined });
    const res = await transitionReservationStatusAdmin('rX', 'confirmee', TRANSITIONS);
    expect(res).toEqual({ ok: false, reason: 'introuvable' });
    expect(txUpdateMock).not.toHaveBeenCalled();
  });
});
