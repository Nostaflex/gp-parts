import { formatPrice } from '@/lib/utils';
import type { Reservation } from '@/lib/reservations';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildReservationConfirmationEmail(r: Reservation): {
  subject: string;
  html: string;
} {
  const subject = `Demande de réservation reçue — ${escapeHtml(r.reference)}`;
  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#1A0F06;">
  <h2>Merci ${escapeHtml(r.customer.prenom)} !</h2>
  <p>Votre demande de réservation pour la <strong>${escapeHtml(r.carLabel)}</strong> a bien été reçue.
  Nous vous recontactons rapidement pour la confirmer.</p>
  <table style="width:100%;max-width:480px;border-collapse:collapse;margin-top:12px;">
    <tr><td>Référence</td><td style="text-align:right;font-weight:600;">${escapeHtml(r.reference)}</td></tr>
    <tr><td>Du</td><td style="text-align:right;">${escapeHtml(r.dateDepart)}</td></tr>
    <tr><td>Au</td><td style="text-align:right;">${escapeHtml(r.dateRetour)}</td></tr>
    <tr><td>Durée</td><td style="text-align:right;">${r.nbJours} jour(s)</td></tr>
    <tr><td>Total estimé</td><td style="text-align:right;font-weight:700;">${formatPrice(r.totalEnCents)}</td></tr>
  </table>
  <p style="font-size:12px;color:#999;margin-top:16px;">Car Performance Guadeloupe — cette estimation ne vaut pas confirmation.</p>
</body></html>`;
  return { subject, html };
}
