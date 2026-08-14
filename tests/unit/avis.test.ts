import { describe, it, expect, vi, beforeEach } from 'vitest';

import { normalizeAvisList, noteMoyenne } from '@/lib/avis';
import { AvisDepotSchema } from '@/lib/schemas/avis';

// ─── Dépôt public : validation stricte ───────────────────────────────────────
describe('AvisDepotSchema', () => {
  const valide = {
    prenom: 'Marie',
    note: 5,
    texte: 'Très bonne prise en charge, délais respectés, je recommande ce garage.',
    prestation: 'reparation',
    email: '',
  };

  it('dépôt valide → OK', () => {
    expect(AvisDepotSchema.safeParse(valide).success).toBe(true);
  });

  it('texte trop court → refus avec message modération', () => {
    const r = AvisDepotSchema.safeParse({ ...valide, texte: 'Top !' });
    expect(r.success).toBe(false);
  });

  it('note hors bornes → refus', () => {
    expect(AvisDepotSchema.safeParse({ ...valide, note: 0 }).success).toBe(false);
    expect(AvisDepotSchema.safeParse({ ...valide, note: 6 }).success).toBe(false);
  });
});

// ─── Lecture publique : fail-open + jamais de non-publié qui fuite ───────────
describe('normalizeAvisList + noteMoyenne', () => {
  it('items invalides filtrés, note bornée 1-5', () => {
    const out = normalizeAvisList([
      { id: 'a1', prenom: 'Luc', note: 9, texte: 'Bien', status: 'publie' },
      { id: 'a2', prenom: '', note: 4, texte: 'Sans prénom' },
      null,
      { id: 'a3', prenom: 'Zoé', note: 3, texte: 'Correct', status: 'inconnu' },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].note).toBe(5); // borné
    expect(out[1].status).toBe('nouveau'); // statut inconnu → jamais « publié » par accident
  });

  it('moyenne au dixième ; null si vide', () => {
    expect(noteMoyenne([{ note: 5 }, { note: 4 }, { note: 4 }])).toBe(4.3);
    expect(noteMoyenne([])).toBeNull();
  });
});

// ─── Modération : transaction + lock, jamais de réécriture du texte ─────────
const { txGetMock, txUpdateMock } = vi.hoisted(() => ({
  txGetMock: vi.fn(),
  txUpdateMock: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({
    collection: () => ({ doc: () => ({}), add: vi.fn(), orderBy: vi.fn() }),
    runTransaction: async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ get: txGetMock, update: txUpdateMock }),
  })),
}));

import { moderateAvisAdmin } from '@/lib/server/avis';

const T0 = '2026-08-13T00:00:00.000Z';

describe('moderateAvisAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txGetMock.mockResolvedValue({ exists: true, data: () => ({ updatedAt: T0 }) });
  });

  it('publier → status + publishedAt posés, texte JAMAIS touché', async () => {
    const res = await moderateAvisAdmin('a1', T0, { status: 'publie' });
    expect(res).toEqual({ ok: true });
    const written = txUpdateMock.mock.calls[0][1] as Record<string, unknown>;
    expect(written.status).toBe('publie');
    expect(written.publishedAt).toBeTruthy();
    // Garde légale : la modération n'écrit jamais le champ texte.
    expect('texte' in written).toBe(false);
  });

  it('conflit de lock → refus explicite, aucune écriture', async () => {
    txGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ updatedAt: '2026-08-14T00:00:00.000Z' }),
    });
    const res = await moderateAvisAdmin('a1', T0, { status: 'publie' });
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining('modifié') });
    expect(txUpdateMock).not.toHaveBeenCalled();
  });

  it('rejeter un avis publié → publishedAt remis à null', async () => {
    await moderateAvisAdmin('a1', T0, { status: 'rejete' });
    const written = txUpdateMock.mock.calls[0][1] as Record<string, unknown>;
    expect(written.publishedAt).toBeNull();
  });
});
