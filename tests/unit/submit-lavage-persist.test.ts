import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createDemandeIntake, getPrisEffectifs, getCachedLavageSettings } = vi.hoisted(() => ({
  createDemandeIntake: vi.fn(async (_d: Record<string, unknown>) => 'dem-lav'),
  getPrisEffectifs: vi.fn(async (_dates: string[]) => ({}) as Record<string, string[]>),
  // Référentiel des formules (audit 2026-08-20 : le serveur valide contre le
  // BO, plus contre le client).
  getCachedLavageSettings: vi.fn(async () => ({
    formules: [
      {
        nom: 'Complet',
        description: '',
        inclus: [],
        tarifs: [{ label: 'Forfait', prixTTCEnCents: 8000 }],
      },
      {
        nom: 'Premium Wash',
        description: '',
        inclus: [],
        tarifs: [
          { label: 'Citadine', prixTTCEnCents: 3000 },
          { label: 'SUV', prixTTCEnCents: 9000 },
        ],
      },
    ],
  })),
}));
vi.mock('@/lib/server/intake', () => ({ createDemandeIntake }));
vi.mock('@/lib/server/lavage-dispos', () => ({ getPrisEffectifs }));
vi.mock('@/lib/data/lavage-settings-cache', () => ({ getCachedLavageSettings }));
vi.mock('@/lib/emails/send', () => ({ sendLeadEmails: vi.fn(async () => ({ emailed: true })) }));

import { sendLeadEmails } from '@/lib/emails/send';
import { submitLavage } from '@/app/lavage/actions';
import { localDateISO } from '@/lib/utils';

const base = {
  prenom: 'Marie',
  nom: 'Test',
  email: 'marie@test.gp',
  tel: '0690112233',
  marque: 'Peugeot',
  modele: '308',
  formule: 'Complet',
  // Dates relatives : le serveur refuse désormais passé et hors horizon.
  date: localDateISO(3),
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
    expect(msg).toContain(base.date);
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
    getPrisEffectifs.mockResolvedValue({});
  });

  it('RDV structuré persisté (rdvDate + rdvCreneau)', async () => {
    await submitLavage(base);
    expect(createDemandeIntake).toHaveBeenCalledWith(
      expect.objectContaining({ rdvDate: base.date, rdvCreneau: '09:00 – 10:00' })
    );
  });

  it('créneau bloqué → refus explicite, rien persisté', async () => {
    getPrisEffectifs.mockResolvedValue({ [base.date]: ['09:00 – 10:00'] });
    const res = await submitLavage(base);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('créneau');
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('autre créneau bloqué → la demande passe', async () => {
    getPrisEffectifs.mockResolvedValue({ [base.date]: ['08:00 – 09:00'] });
    const res = await submitLavage(base);
    expect(res.ok).toBe(true);
    expect(createDemandeIntake).toHaveBeenCalled();
  });

  it('lecture dispos en panne → fail-open, la demande passe (jamais un lead perdu)', async () => {
    getPrisEffectifs.mockRejectedValue(new Error('firestore down'));
    const res = await submitLavage(base);
    expect(res.ok).toBe(true);
    expect(createDemandeIntake).toHaveBeenCalled();
  });
});

describe('submitLavage — durcissement serveur (audit 2026-08-20)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPrisEffectifs.mockResolvedValue({});
  });

  it('créneau hors référentiel → refus, rien persisté', async () => {
    const res = await submitLavage({ ...base, creneau: '23:00 – 00:00' });
    expect(res.ok).toBe(false);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('formule inconnue du BO → refus explicite', async () => {
    const res = await submitLavage({ ...base, formule: '<script>pwn</script>' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('Formule');
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('formule multi-tarifs sans gabarit valide → refus', async () => {
    const res = await submitLavage({ ...base, formule: 'Premium Wash', gabarit: 'Zeppelin' });
    expect(res.ok).toBe(false);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('formule multi-tarifs avec gabarit du BO → passe', async () => {
    const res = await submitLavage({ ...base, formule: 'Premium Wash', gabarit: 'SUV' });
    expect(res.ok).toBe(true);
  });

  it('date passée → refus', async () => {
    const res = await submitLavage({ ...base, date: localDateISO(-2) });
    expect(res.ok).toBe(false);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('date au-delà de l’horizon de gestion (60 j) → refus', async () => {
    const res = await submitLavage({ ...base, date: localDateISO(90) });
    expect(res.ok).toBe(false);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('message au-delà de 1000 caractères → refus', async () => {
    const res = await submitLavage({ ...base, message: 'x'.repeat(1001) });
    expect(res.ok).toBe(false);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });
});
