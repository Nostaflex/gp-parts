import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/emails/send', () => ({ sendReservationEmails: vi.fn() }));
vi.mock('@/lib/server/intake', () => ({
  createReservationIntake: vi.fn(async () => 'res-test'),
  createDemandeIntake: vi.fn(async () => 'dem-test'),
}));
vi.mock('@/lib/server/availability', () => ({
  getBusyRangesForCar: vi.fn(async () => []),
  getUnavailableCarIds: vi.fn(async () => []),
}));
vi.mock('@/lib/server/location-settings', () => ({
  getLocationSettings: vi.fn(async () => DEFAULT_LOCATION_SETTINGS),
}));

import { DEFAULT_LOCATION_SETTINGS } from '@/lib/location-settings';
import { getBusyRangesForCar, getUnavailableCarIds } from '@/lib/server/availability';
import { createReservationIntake, createDemandeIntake } from '@/lib/server/intake';
import { validateReservation, checkDispo, submitDevisLLD } from '../../app/location/actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBusyRangesForCar).mockResolvedValue([]);
  vi.mocked(getUnavailableCarIds).mockResolvedValue([]);
});

const base = {
  locationCarId: 'clio-v',
  dateDepart: '2099-07-01',
  dateRetour: '2099-07-05',
  heureDepart: '09:00',
  heureRetour: '17:00',
  prenom: 'Marie',
  nom: 'Dupont',
  email: 'marie@example.com',
  telephone: '0690123456',
  permis: '123456789',
  dateNaissance: '1990-03-15',
  dateObtentionPermis: '2010-06-01',
  adresseRue: '12 rue des Alizés',
  adresseCodePostal: '97122',
  adresseVille: 'Baie-Mahault',
  consent: true,
  cgl: true,
};

describe('validateReservation', () => {
  it('succès : recompute nbJours + total, renvoie une référence LOC-', async () => {
    const res = await validateReservation(base);
    expect(res.success).toBe(true);
    expect(res.reference).toMatch(/^LOC-/);
  });

  it('rejette si dateRetour <= dateDepart', async () => {
    const res = await validateReservation({ ...base, dateRetour: '2099-07-01' });
    expect(res.success).toBe(false);
    expect(res.errors.dateRetour).toBeDefined();
  });

  it('rejette une date de départ passée', async () => {
    const res = await validateReservation({
      ...base,
      dateDepart: '2000-01-01',
      dateRetour: '2000-01-05',
    });
    expect(res.success).toBe(false);
    expect(res.errors.dateDepart).toBeDefined();
  });

  it('rejette une voiture introuvable', async () => {
    const res = await validateReservation({ ...base, locationCarId: 'inconnu' });
    expect(res.success).toBe(false);
    expect(res.errors._form).toBeDefined();
  });

  it('rejette une voiture indisponible', async () => {
    const res = await validateReservation({ ...base, locationCarId: 'renault-trafic' });
    expect(res.success).toBe(false);
    expect(res.errors._form).toBeDefined();
  });

  it('rejette sans consentement', async () => {
    const res = await validateReservation({ ...base, consent: false });
    expect(res.success).toBe(false);
    expect(res.errors.consent).toBeDefined();
  });

  it('rejette un email invalide', async () => {
    const res = await validateReservation({ ...base, email: 'nope' });
    expect(res.success).toBe(false);
    expect(res.errors.email).toBeDefined();
  });

  it('rejette si les dates chevauchent une réservation existante', async () => {
    vi.mocked(getBusyRangesForCar).mockResolvedValue([
      { dateDepart: '2099-07-03', dateRetour: '2099-07-08' },
    ]);
    const res = await validateReservation(base); // 07-01 → 07-05
    expect(res.success).toBe(false);
    expect(res.errors._form).toMatch(/déjà réservé/i);
  });

  it('passe si les réservations existantes ne chevauchent pas', async () => {
    vi.mocked(getBusyRangesForCar).mockResolvedValue([
      { dateDepart: '2099-07-10', dateRetour: '2099-07-15' },
    ]);
    const res = await validateReservation(base); // 07-01 → 07-05
    expect(res.success).toBe(true);
  });

  // ─── Funnel v2 : gates conducteur + CGL + caution + LLD ────────────────────

  it('rejette un conducteur trop jeune (< 21 ans à la date de départ)', async () => {
    const res = await validateReservation({ ...base, dateNaissance: '2080-01-01' });
    expect(res.success).toBe(false);
    expect(res.errors.dateNaissance).toMatch(/21 ans/);
  });

  it('rejette un permis trop récent (< 2 ans à la date de départ)', async () => {
    const res = await validateReservation({ ...base, dateObtentionPermis: '2098-01-01' });
    expect(res.success).toBe(false);
    expect(res.errors.dateObtentionPermis).toMatch(/2 an/);
  });

  it('borne exacte : 21 ans pile le jour du départ → accepté', async () => {
    const res = await validateReservation({ ...base, dateNaissance: '2078-07-01' });
    expect(res.success).toBe(true);
  });

  it('rejette sans acceptation des CGL', async () => {
    const res = await validateReservation({ ...base, cgl: false });
    expect(res.success).toBe(false);
    expect(res.errors.cgl).toBeDefined();
  });

  it('rejette sans adresse complète', async () => {
    const res = await validateReservation({ ...base, adresseVille: '' });
    expect(res.success).toBe(false);
    expect(res.errors.adresseVille).toBeDefined();
  });

  it('≥ 30 jours → rejet avec renvoi vers le devis longue durée', async () => {
    const res = await validateReservation({ ...base, dateRetour: '2099-08-05' });
    expect(res.success).toBe(false);
    expect(res.errors._form).toMatch(/longue durée/i);
  });

  it('snapshot caution + CGL horodatées + heures dans la réservation créée', async () => {
    const res = await validateReservation(base);
    expect(res.success).toBe(true);
    const [written] = vi.mocked(createReservationIntake).mock.calls[0];
    // clio-v = Citadine → défaut 800 € (aucune caution posée sur la voiture statique)
    expect(written.cautionEnCents).toBe(
      DEFAULT_LOCATION_SETTINGS.cautionsParCategorieEnCents.Citadine
    );
    expect(typeof written.cglAcceptedAt).toBe('string');
    expect(written.heureDepart).toBe('09:00');
    expect(written.customer.dateNaissance).toBe('1990-03-15');
    expect(written.customer.adresse).toEqual({
      rue: '12 rue des Alizés',
      codePostal: '97122',
      ville: 'Baie-Mahault',
    });
  });
});

describe('submitDevisLLD', () => {
  it('demande valide → Demande type location créée', async () => {
    const res = await submitDevisLLD({
      dureeMois: '3',
      kmParMois: '1500',
      categorie: 'SUV',
      budgetMensuel: '900',
      prenom: 'Marie',
      nom: 'Dupont',
      email: 'marie@example.com',
      telephone: '0690123456',
      consent: true,
    });
    expect(res.success).toBe(true);
    const [written] = vi.mocked(createDemandeIntake).mock.calls[0];
    expect(written.type).toBe('location');
    expect(written.message).toContain('Devis LLD');
    expect(written.message).toContain('3 mois');
  });

  it('email invalide → erreur, rien créé', async () => {
    const res = await submitDevisLLD({
      dureeMois: '3',
      kmParMois: '',
      categorie: '',
      budgetMensuel: '',
      prenom: 'Marie',
      nom: 'Dupont',
      email: 'nope',
      telephone: '0690123456',
      consent: true,
    });
    expect(res.success).toBe(false);
    expect(res.errors.email).toBeDefined();
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });

  it('honeypot rempli → succès factice, rien créé', async () => {
    const res = await submitDevisLLD({
      dureeMois: '3',
      kmParMois: '',
      categorie: '',
      budgetMensuel: '',
      prenom: 'Bot',
      nom: 'Bot',
      email: 'bot@spam.com',
      telephone: '0690123456',
      consent: true,
      website: 'spam',
    });
    expect(res.success).toBe(true);
    expect(createDemandeIntake).not.toHaveBeenCalled();
  });
});

describe('checkDispo', () => {
  it('renvoie les IDs indisponibles pour des dates valides', async () => {
    vi.mocked(getUnavailableCarIds).mockResolvedValue(['clio-v']);
    const res = await checkDispo('2099-07-01', '2099-07-05');
    expect(res.unavailableIds).toEqual(['clio-v']);
  });

  it('dates malformées → aucun appel Firestore, liste vide', async () => {
    const res = await checkDispo('<script>', '2099-07-05');
    expect(res.unavailableIds).toEqual([]);
    expect(getUnavailableCarIds).not.toHaveBeenCalled();
  });
});
