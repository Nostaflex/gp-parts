// Emails de "lead" (demande de RDV réparation + message de contact).
// Deux templates : notification au gérant (le lead à ne pas perdre) +
// accusé de réception au client.

export type Lead = {
  kind: 'rdv' | 'contact';
  ref: string;
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  // Contact :
  sujet?: string;
  message: string;
  // RDV réparation :
  vehicule?: string;
  prestation?: string;
  date?: string;
  creneau?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function rows(pairs: [string, string | undefined][]): string {
  return pairs
    .filter(([, v]) => v && v.trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#777;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0;color:#1a1a1a"><strong>${esc(v as string)}</strong></td></tr>`
    )
    .join('');
}

const kindLabel = (l: Lead) =>
  l.kind === 'rdv' ? 'demande de RDV réparation' : 'message de contact';

/** Notification au gérant — contient tout ce qu'il faut pour rappeler le client. */
export function buildLeadNotificationEmail(l: Lead): { subject: string; html: string } {
  const subject = `Nouvelle ${kindLabel(l)} — ${l.prenom} ${l.nom} [${l.ref}]`;
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
  <h2 style="margin:0 0 4px">Nouvelle ${kindLabel(l)}</h2>
  <p style="margin:0 0 16px;color:#777">Référence ${esc(l.ref)}</p>
  <table style="border-collapse:collapse;font-size:14px">
    ${rows([
      ['Client', `${l.prenom} ${l.nom}`],
      ['Email', l.email],
      ['Téléphone', l.tel],
      ['Sujet', l.sujet],
      ['Véhicule', l.vehicule],
      ['Prestation', l.prestation],
      ['Date souhaitée', l.date],
      ['Créneau', l.creneau],
    ])}
  </table>
  <p style="margin:16px 0 4px;color:#777;font-size:13px">Message :</p>
  <p style="margin:0;white-space:pre-line;font-size:14px">${esc(l.message || '—')}</p>
</div>`.trim();
  return { subject, html };
}

/** Accusé de réception au client. */
export function buildLeadAckEmail(l: Lead): { subject: string; html: string } {
  const subject =
    l.kind === 'rdv'
      ? 'Votre demande de RDV est bien reçue — Car Performance'
      : 'Votre message est bien reçu — Car Performance';
  const intro =
    l.kind === 'rdv'
      ? 'Votre demande de rendez-vous a bien été enregistrée. Nous vous recontactons sous 1h (jours ouvrés) pour valider le créneau.'
      : 'Votre message a bien été reçu. Nous vous répondons sous 24h.';
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
  <h2 style="margin:0 0 12px">Merci ${esc(l.prenom)} !</h2>
  <p style="margin:0 0 12px;font-size:14px;line-height:1.6">${intro}</p>
  <p style="margin:0 0 16px;font-size:14px">Référence : <strong>${esc(l.ref)}</strong></p>
  <p style="margin:0;color:#777;font-size:13px">Car Performance — Garage auto &amp; moto, Guadeloupe</p>
</div>`.trim();
  return { subject, html };
}
