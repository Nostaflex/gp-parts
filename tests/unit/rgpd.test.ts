import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DROITS_RGPD, droitLabel, echeanceRgpd, joursRestantsRgpd } from '@/lib/rgpd';

vi.mock('@/lib/server/intake', () => ({
  createReservationIntake: vi.fn(async () => 'res-test'),
  createDemandeIntake: vi.fn(async () => 'dem-test'),
}));

import { createDemandeIntake } from '@/lib/server/intake';
import { submitDemandeDroit } from '../../app/mentions-legales/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('rgpd — catalogue et échéance légale', () => {
  it('5 droits actionnables, libellés stables', () => {
    expect(DROITS_RGPD.map((d) => d.key)).toEqual([
      'acces',
      'rectification',
      'effacement',
      'portabilite',
      'opposition',
    ]);
    expect(droitLabel('effacement')).toBe('Effacement');
  });

  it('échéance = création + 30 jours (art. 12.3)', () => {
    expect(echeanceRgpd('2026-08-18T10:00:00.000Z').toISOString()).toBe('2026-09-17T10:00:00.000Z');
  });

  it('jours restants : positif avant, négatif après la limite', () => {
    const created = '2026-08-18T10:00:00.000Z';
    expect(joursRestantsRgpd(created, Date.parse('2026-08-20T10:00:00.000Z'))).toBe(28);
    expect(joursRestantsRgpd(created, Date.parse('2026-09-20T10:00:00.000Z'))).toBe(-3);
  });
});

describe('submitDemandeDroit — la demande arrive au BO, pas seulement par email', () => {
  const base = {
    droit: 'acces',
    nom: 'Marie Dupont',
    email: 'marie@example.com',
    telephone: '0690 11 22 33',
    message: 'Merci de m’envoyer mes données.',
  };

  it('demande valide → Demande type rgpd avec le droit en resourceRef', async () => {
    const res = await submitDemandeDroit({ ...base });
    expect(res.success).toBe(true);
    expect(createDemandeIntake).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(createDemandeIntake).mock.calls[0][0];
    expect(arg.type).toBe('rgpd');
    expect(arg.resourceRef).toBe('acces');
    expect(arg.message).toContain('[Droit Accès]');
    expect(arg.status).toBe('nouvelle');
  });

  it('droit inconnu → refus propre, rien créé', async () => {
    const res = await submitDemandeDroit({ ...base, droit: 'vendre-mes-donnees' });
    expect(res.success).toBe(false);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('email invalide → erreur de champ', async () => {
    const res = await submitDemandeDroit({ ...base, email: 'pas-un-email' });
    expect(res.success).toBe(false);
    expect(res.errors.email).toBeTruthy();
  });

  it('honeypot rempli → succès factice, rien créé', async () => {
    const res = await submitDemandeDroit({ ...base, website: 'spam' });
    expect(res.success).toBe(true);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });
});
