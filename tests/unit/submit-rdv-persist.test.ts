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

describe('submitRdv — parcours mécanique / carrosserie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mécanique : nature + roulable dans le message admin', async () => {
    const res = await submitRdv({
      ...base,
      nature: 'mecanique',
      type: 'Freinage',
      roulable: 'Non',
    });
    const msg = createDemandeIntake.mock.calls[0][0].message as string;
    expect(msg).toContain('Nature : Panne / Mécanique');
    expect(msg).toContain('Véhicule roulable : Non');
    expect(msg).not.toContain('Sinistre');
    expect(res.ok).toBe(true);
  });

  it('carrosserie : nature + sinistre dans le message admin', async () => {
    const res = await submitRdv({
      ...base,
      nature: 'carrosserie',
      type: 'Carrosserie',
      sinistre: 'En cours',
    });
    const msg = createDemandeIntake.mock.calls[0][0].message as string;
    expect(msg).toContain('Nature : Carrosserie');
    expect(msg).toContain('Sinistre assurance : En cours');
    expect(msg).not.toContain('roulable');
    expect(res.ok).toBe(true);
  });

  it('carrosserie : kilométrage + assurance + n° assuré dans le message admin (réponse S2 Stéphane)', async () => {
    const res = await submitRdv({
      ...base,
      nature: 'carrosserie',
      type: 'Carrosserie',
      sinistre: 'Oui, déclaré',
      kilometrage: '85 000',
      assurance: 'GFA Caraïbes',
      numAssure: 'A-123456',
    });
    const msg = createDemandeIntake.mock.calls[0][0].message as string;
    expect(msg).toContain('Kilométrage : 85 000 km');
    expect(msg).toContain('Assurance : GFA Caraïbes');
    expect(msg).toContain("N° d'assuré : A-123456");
    expect(res.ok).toBe(true);
  });

  it('carrosserie sans champs assurance (ancien formulaire) : aucune ligne fantôme', async () => {
    const res = await submitRdv({
      ...base,
      nature: 'carrosserie',
      type: 'Carrosserie',
      sinistre: 'Non / sans assurance',
    });
    const msg = createDemandeIntake.mock.calls[0][0].message as string;
    expect(msg).not.toContain('Kilométrage');
    expect(msg).not.toContain('Assurance :');
    expect(msg).not.toContain("N° d'assuré");
    expect(res.ok).toBe(true);
  });

  it('sans nature (ancien formulaire encore ouvert) : soumission OK, pas de ligne Nature', async () => {
    const res = await submitRdv(base);
    const msg = createDemandeIntake.mock.calls[0][0].message as string;
    expect(msg).not.toContain('Nature :');
    expect(res.ok).toBe(true);
  });
});
