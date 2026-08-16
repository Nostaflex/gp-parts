import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createDemandeIntake, getBlocages } = vi.hoisted(() => ({
  createDemandeIntake: vi.fn(async (_d: Record<string, unknown>) => 'dem-lav'),
  getBlocages: vi.fn(async (_date: string) => [] as { creneau: string; source: string }[]),
}));
vi.mock('@/lib/server/intake', () => ({ createDemandeIntake }));
vi.mock('@/lib/server/lavage-dispos', () => ({ getBlocages }));
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

  it('gabarit fourni → dans le message admin et la prestation email', async () => {
    const res = await submitLavage({ ...base, formule: 'Premium Wash', gabarit: 'SUV' });
    const msg = createDemandeIntake.mock.calls[0][0].message as string;
    expect(msg).toContain('Formule : Premium Wash — SUV');
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

describe('submitLavage — disponibilités des créneaux', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBlocages.mockResolvedValue([]);
  });

  it('RDV structuré persisté (rdvDate + rdvCreneau)', async () => {
    await submitLavage(base);
    expect(createDemandeIntake).toHaveBeenCalledWith(
      expect.objectContaining({ rdvDate: '2026-09-01', rdvCreneau: '09:00 – 10:00' })
    );
  });

  it('créneau bloqué → refus explicite, rien persisté', async () => {
    getBlocages.mockResolvedValue([{ creneau: '09:00 – 10:00', source: 'rdv' }]);
    const res = await submitLavage(base);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('créneau');
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('autre créneau bloqué → la demande passe', async () => {
    getBlocages.mockResolvedValue([{ creneau: '08:00 – 09:00', source: 'manuel' }]);
    const res = await submitLavage(base);
    expect(res.ok).toBe(true);
    expect(createDemandeIntake).toHaveBeenCalled();
  });

  it('lecture dispos en panne → fail-open, la demande passe (jamais un lead perdu)', async () => {
    getBlocages.mockRejectedValue(new Error('firestore down'));
    const res = await submitLavage(base);
    expect(res.ok).toBe(true);
    expect(createDemandeIntake).toHaveBeenCalled();
  });
});
