import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createDemandeIntake } = vi.hoisted(() => ({
  createDemandeIntake: vi.fn(async () => 'dem-1'),
}));
vi.mock('@/lib/server/intake', () => ({ createDemandeIntake }));
vi.mock('@/lib/emails/send', () => ({ sendLeadEmails: vi.fn(async () => ({ emailed: true })) }));

import { sendLeadEmails } from '@/lib/emails/send';
import { submitContact } from '@/app/contact/actions';

const base = {
  prenom: 'Jean',
  nom: 'Test',
  email: 'jean@test.gp',
  tel: '0690112233',
  sujet: 'Vente véhicule',
  message: 'Bonjour je suis intéressé par ce véhicule en particulier.',
  ref: 'peugeot-308sw',
};

describe('submitContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste via intake au bon type + ref, puis email', async () => {
    const res = await submitContact(base);
    expect(createDemandeIntake).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'vehicule', resourceRef: 'peugeot-308sw' })
    );
    expect(sendLeadEmails).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('ok même si email rejette', async () => {
    vi.mocked(sendLeadEmails).mockRejectedValueOnce(new Error('down'));
    expect((await submitContact(base)).ok).toBe(true);
  });

  it('honeypot rempli → drop silencieux (ni intake ni email)', async () => {
    const res = await submitContact({ ...base, website: 'http://spam.ru' });
    expect(createDemandeIntake).not.toHaveBeenCalled();
    expect(sendLeadEmails).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('validation échoue → pas de création', async () => {
    const res = await submitContact({ ...base, email: 'pasemail' });
    expect(createDemandeIntake).not.toHaveBeenCalled();
    expect(res.ok).toBe(false);
  });
});
