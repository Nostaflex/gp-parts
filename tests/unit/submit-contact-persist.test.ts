import { describe, it, expect, vi, beforeEach } from 'vitest';

const createDemande = vi.fn(async () => 'dem-1');
vi.mock('@/lib/data', () => ({ getAdapter: vi.fn(async () => ({ createDemande })) }));
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

describe('submitContact persiste', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crée une demande au bon type + resourceRef puis email', async () => {
    const res = await submitContact(base);
    expect(createDemande).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'vehicule',
        status: 'nouvelle',
        nom: 'Jean Test',
        email: 'jean@test.gp',
        resourceRef: 'peugeot-308sw',
      })
    );
    expect(sendLeadEmails).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('email best-effort : ok même si sendLeadEmails rejette', async () => {
    vi.mocked(sendLeadEmails).mockRejectedValueOnce(new Error('smtp down'));
    const res = await submitContact(base);
    expect(createDemande).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('validation échoue → pas de création', async () => {
    const res = await submitContact({ ...base, email: 'pasemail' });
    expect(createDemande).not.toHaveBeenCalled();
    expect(res.ok).toBe(false);
  });
});
