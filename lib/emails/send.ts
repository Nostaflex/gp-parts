import { getResend, EMAIL_FROM, EMAIL_ADMIN } from '@/lib/email';
import { buildOrderConfirmationEmail } from '@/lib/emails/orderConfirmation';
import { buildOrderNotificationEmail } from '@/lib/emails/orderNotification';
import { buildReservationConfirmationEmail } from '@/lib/emails/reservationConfirmation';
import { buildReservationNotificationEmail } from '@/lib/emails/reservationNotification';
import { buildLeadNotificationEmail, buildLeadAckEmail, type Lead } from '@/lib/emails/lead';
import type { Order } from '@/lib/types';
import type { Reservation } from '@/lib/reservations';

/**
 * Envoie les emails de commande (fire-and-forget) :
 *  1. confirmation au client,
 *  2. notification au gérant (si `RESEND_ADMIN_EMAIL` configurée).
 *
 * Ne bloque jamais l'appelant : si Resend échoue, on logge sans propager.
 * Silencieux si `RESEND_API_KEY` absente (dev/test).
 *
 * Appelé par : checkout sur place (immédiat) et webhook Stripe (au paiement
 * réel, chemin carte).
 */
export function sendOrderEmails(order: Order): void {
  if (!process.env.RESEND_API_KEY) return;

  const confirmation = buildOrderConfirmationEmail(order);
  getResend()
    .emails.send({
      from: EMAIL_FROM,
      to: order.customer.email,
      subject: confirmation.subject,
      html: confirmation.html,
    })
    .catch((err) => console.error('[emails] Confirmation client échouée:', err));

  if (EMAIL_ADMIN) {
    const notification = buildOrderNotificationEmail(order);
    getResend()
      .emails.send({
        from: EMAIL_FROM,
        to: EMAIL_ADMIN,
        subject: notification.subject,
        html: notification.html,
      })
      .catch((err) => console.error('[emails] Notification gérant échouée:', err));
  }
}

/**
 * Emails de réservation (fire-and-forget) : accusé client + notif gérant.
 * Silencieux si RESEND_API_KEY absente.
 */
export function sendReservationEmails(reservation: Reservation): void {
  if (!process.env.RESEND_API_KEY) return;

  const confirmation = buildReservationConfirmationEmail(reservation);
  getResend()
    .emails.send({
      from: EMAIL_FROM,
      to: reservation.customer.email,
      subject: confirmation.subject,
      html: confirmation.html,
    })
    .catch((err) => console.error('[emails] Accusé réservation client échoué:', err));

  if (EMAIL_ADMIN) {
    const notification = buildReservationNotificationEmail(reservation);
    getResend()
      .emails.send({
        from: EMAIL_FROM,
        to: EMAIL_ADMIN,
        subject: notification.subject,
        html: notification.html,
      })
      .catch((err) => console.error('[emails] Notif réservation gérant échouée:', err));
  }
}

/**
 * Emails de lead (RDV réparation / contact). Contrairement aux autres,
 * on AWAIT la notification gérant : c'est le lead à ne jamais perdre, et
 * l'UI a besoin de savoir si l'envoi a réellement eu lieu (pas de fausse
 * confirmation). Retourne `emailed` = un email a bien été envoyé.
 * Silencieux (emailed=false) si `RESEND_API_KEY` absente (dev/test).
 */
export async function sendLeadEmails(lead: Lead): Promise<{ emailed: boolean }> {
  if (!process.env.RESEND_API_KEY) return { emailed: false };

  let emailed = false;

  // 1. Notification gérant (critique) — awaited.
  if (EMAIL_ADMIN) {
    const notification = buildLeadNotificationEmail(lead);
    try {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: EMAIL_ADMIN,
        replyTo: lead.email,
        subject: notification.subject,
        html: notification.html,
      });
      emailed = true;
    } catch (err) {
      console.error('[emails] Notif lead gérant échouée:', err);
    }
  }

  // 2. Accusé client — fire-and-forget (non bloquant).
  const ack = buildLeadAckEmail(lead);
  getResend()
    .emails.send({ from: EMAIL_FROM, to: lead.email, subject: ack.subject, html: ack.html })
    .catch((err) => console.error('[emails] Accusé lead client échoué:', err));

  return { emailed };
}
