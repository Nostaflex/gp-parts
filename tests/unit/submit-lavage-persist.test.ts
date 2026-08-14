import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createDemandeIntake } = vi.hoisted(() => ({
  createDemandeIntake: vi.fn(async (_d: Record<string, unknown>) => 'dem-lav'),
}));
vi.mock('@/lib/server/intake', () => ({ createDemandeIntake }));
vi.mock('@/lib/emails/send', () => ({ sendLeadEmails: vi.fn(async () => ({ emailed: true })) }));

import { sendLeadEmails } from '@/lib/emails/send';
import { submitLavage } from '@/app/lavage/actions';

const base = {
  prenom: 'Marie',
  nom: 'Test',
  email: 'marie@test.gp',
  tel: '0690112233',
  marque: 'Peugeot',
  modele: '308',
  formule: 'Complet',
  date: '2026-09-01',
  creneau: '09:00 – 10:00',
  message: 'Poils de chien sur la banquette.',
};

describe('submitLavage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste type lavage + formule aplatie', async () => {
    const res = await submitLavage(base);
    expect(createDemandeIntake).toHaveBeenCalledWith(expect.objectContaining({ type: 'lavage' }));
    const msg = createDemandeIntake.mock.calls[0][0].message as string;
    expect(msg).toContain('Formule : Complet');
    expect(msg).toContain('2026-09-01');
    expect(res.ok).toBe(true);
  });

  it('formule manquante → erreur', async () => {
    const res = await submitLavage({ ...base, formule: '' });
    expect(res.ok).toBe(false);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('honeypot rempli → drop silencieux', async () => {
    const res = await submitLavage({ ...base, website: 'x' });
    expect(createDemandeIntake).not.toHaveBeenCalled();
    expect(sendLeadEmails).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });
});
