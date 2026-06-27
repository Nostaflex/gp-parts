import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createDemandeIntake } = vi.hoisted(() => ({
  createDemandeIntake: vi.fn(async (_d: Record<string, unknown>) => 'dem-2'),
}));
vi.mock('@/lib/server/intake', () => ({ createDemandeIntake }));
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

describe('submitRdv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste type reparation + détails aplatis', async () => {
    const res = await submitRdv(base);
    expect(createDemandeIntake).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reparation' })
    );
    expect(createDemandeIntake.mock.calls[0][0].message).toContain('2026-07-01');
    expect(res.ok).toBe(true);
  });

  it('honeypot rempli → drop silencieux', async () => {
    const res = await submitRdv({ ...base, website: 'x' });
    expect(createDemandeIntake).not.toHaveBeenCalled();
    expect(sendLeadEmails).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });
});
