import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildOrderConfirmationEmail(order: Order): { subject: string; html: string } {
  const subject = `Commande confirmée — ${escapeHtml(order.orderNumber)}`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #E5DDD3;color:#1A0F06;font-size:14px;">
          ${item.quantity}× ${escapeHtml(item.name)}
          <span style="display:block;font-size:12px;color:#999;margin-top:2px;">${escapeHtml(item.reference)}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #E5DDD3;color:#1A0F06;font-size:14px;text-align:right;font-weight:600;">
          ${formatPrice(item.priceInCents * item.quantity)}
        </td>
      </tr>`
    )
    .join('');

  const deliveryLabel =
    order.delivery.option === 'store-pickup'
      ? 'Retrait en boutique · Baie-Mahault · Sous 24h'
      : `Livraison à domicile · ${escapeHtml(order.delivery.address)}, ${escapeHtml(order.delivery.postalCode)} ${escapeHtml(order.delivery.city)} · 24-48h`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F8F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#E87200;">
                CAR PERFORMANCE · GUADELOUPE
              </p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#1A0F06;border-radius:16px;padding:40px 32px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#E87200;">
                Commande confirmée
              </p>
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:900;color:#F4EDE0;line-height:1.2;">
                MERCI ${escapeHtml(order.customer.firstName).toUpperCase()} !
              </h1>
              <p style="margin:0;font-size:15px;color:rgba(244,237,224,0.65);line-height:1.6;">
                Votre commande a bien été enregistrée.<br />
                Nous vous contactons rapidement.
              </p>
            </td>
          </tr>

          <tr><td style="height:24px;"></td></tr>

          <!-- Numéro commande -->
          <tr>
            <td style="background:#fff;border-radius:12px;border:1px solid #E5DDD3;padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;">
                Numéro de commande
              </p>
              <p style="margin:0;font-family:'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#1A0F06;">
                ${escapeHtml(order.orderNumber)}
              </p>
            </td>
          </tr>

          <tr><td style="height:16px;"></td></tr>

          <!-- Articles -->
          <tr>
            <td style="background:#fff;border-radius:12px;border:1px solid #E5DDD3;padding:20px 24px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;">
                Récapitulatif
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
                <tr>
                  <td style="padding:8px 0;color:#999;font-size:14px;">Livraison</td>
                  <td style="padding:8px 0;text-align:right;color:#1A0F06;font-size:14px;">
                    ${order.delivery.priceInCents === 0 ? 'Gratuit' : formatPrice(order.delivery.priceInCents)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;color:#1A0F06;font-size:16px;font-weight:900;border-top:2px solid #E5DDD3;">
                    Total
                  </td>
                  <td style="padding:12px 0 0;text-align:right;color:#E87200;font-size:20px;font-weight:900;border-top:2px solid #E5DDD3;">
                    ${formatPrice(order.totalInCents)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:16px;"></td></tr>

          <!-- Livraison -->
          <tr>
            <td style="background:#fff;border-radius:12px;border:1px solid #E5DDD3;padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;">
                ${order.delivery.option === 'store-pickup' ? 'Retrait' : 'Livraison'}
              </p>
              <p style="margin:0;font-size:14px;color:#1A0F06;line-height:1.5;">${deliveryLabel}</p>
            </td>
          </tr>

          <tr><td style="height:32px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#999;">
                Des questions ? Répondez à cet email ou appelez-nous.
              </p>
              <p style="margin:0;font-size:12px;color:#bbb;">
                Car Performance · Baie-Mahault, Guadeloupe 971
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
