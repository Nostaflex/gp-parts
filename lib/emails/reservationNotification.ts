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

export function buildReservationNotificationEmail(r: Reservation): {
  subject: string;
  html: string;
} {
  const c = r.customer;
  const subject = `Nouvelle réservation à traiter — ${escapeHtml(r.reference)}`;
  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#1A0F06;">
  <h2>Réservation ${escapeHtml(r.carLabel)}</h2>
  <table style="width:100%;max-width:520px;border-collapse:collapse;">
    <tr><td>Référence</td><td style="text-align:right;font-weight:600;">${escapeHtml(r.reference)}</td></tr>
    <tr><td>Période</td><td style="text-align:right;">${escapeHtml(r.dateDepart)} → ${escapeHtml(r.dateRetour)} (${r.nbJours}j)</td></tr>
    <tr><td>Total estimé</td><td style="text-align:right;font-weight:700;">${formatPrice(r.totalEnCents)}</td></tr>
  </table>
  <h3>Client</h3>
  <p>
    ${escapeHtml(c.prenom)} ${escapeHtml(c.nom)}<br/>
    Email : ${escapeHtml(c.email)}<br/>
    Tél : ${escapeHtml(c.telephone)}<br/>
    Permis : ${escapeHtml(c.permis)}
  </p>
</body></html>`;
  return { subject, html };
}
