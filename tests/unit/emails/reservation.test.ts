import { describe, it, expect } from 'vitest';
import { buildReservationConfirmationEmail } from '@/lib/emails/reservationConfirmation';
import { buildReservationNotificationEmail } from '@/lib/emails/reservationNotification';
import type { Reservation } from '@/lib/reservations';

const res: Reservation = {
  id: 'r1',
  reference: 'LOC-ABC-1234',
  status: 'nouvelle',
  locationCarId: 'clio-v',
  carLabel: 'Renault Clio V',
  dateDepart: '2026-07-01',
  dateRetour: '2026-07-05',
  nbJours: 4,
  prixJourEnCents: 4500,
  totalEnCents: 18000,
  customer: {
    prenom: 'Marie',
    nom: 'Dupont',
    email: 'marie@example.com',
    telephone: '0690123456',
    permis: '123456789',
  },
  createdAt: '2026-06-02T00:00:00.000Z',
  updatedAt: '2026-06-02T00:00:00.000Z',
  expiresAt: 1800000000000,
};

describe('emails réservation', () => {
  it('confirmation client : sujet avec référence + voiture dans le corps', () => {
    const { subject, html } = buildReservationConfirmationEmail(res);
    expect(subject).toContain('LOC-ABC-1234');
    expect(html).toContain('Renault Clio V');
    expect(html).toContain('180,00');
  });

  it('notification gérant : contient coordonnées + permis + dates', () => {
    const { subject, html } = buildReservationNotificationEmail(res);
    expect(subject).toContain('LOC-ABC-1234');
    expect(html).toContain('marie@example.com');
    expect(html).toContain('0690123456');
    expect(html).toContain('2026-07-01');
  });

  it('échappe le HTML des champs client', () => {
    const xss = { ...res, customer: { ...res.customer, nom: '<script>x</script>' } };
    const { html } = buildReservationNotificationEmail(xss);
    expect(html).not.toContain('<script>x</script>');
  });
});
