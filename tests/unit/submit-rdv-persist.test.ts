import { describe, it, expect, vi, beforeEach } from 'vitest';

const createDemande = vi.fn(async (_d: Record<string, unknown>) => 'dem-2');
vi.mock('@/lib/data', () => ({ getAdapter: vi.fn(async () => ({ createDemande })) }));
vi.mock('@/lib/emails/send', () => ({ sendLeadEmails: vi.fn(async () => ({ emailed: true })) }));

import { sendLeadEmails } from '@/lib/emails/send';
import { submitRdv } from '@/app/reparation/actions';

const base = {
  prenom: 'Marie',
  nom: 'Test',
  email: 'marie@test.gp',
  tel: '0690112233',
  marque: 'Renault',
  modele: 'Clio',
  annee: '2018',
  immat: 'AB-123-CD',
  type: 'Révision',
  description: 'Révision annuelle complète à prévoir.',
  date: '2026-07-01',
  creneau: 'Matin',
};

describe('submitRdv persiste', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crée une demande type reparation avec détails aplatis', async () => {
    const res = await submitRdv(base);
    expect(createDemande).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reparation', status: 'nouvelle', nom: 'Marie Test' })
    );
    const arg = createDemande.mock.calls[0][0];
    expect(arg.message).toContain('Révision');
    expect(arg.message).toContain('2026-07-01');
    expect(res.ok).toBe(true);
  });

  it('ok même si email rejette', async () => {
    vi.mocked(sendLeadEmails).mockRejectedValueOnce(new Error('down'));
    const res = await submitRdv(base);
    expect(createDemande).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });
});
