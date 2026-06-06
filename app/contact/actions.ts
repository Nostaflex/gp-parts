'use server';

import { sendLeadEmails } from '@/lib/emails/send';
import type { Lead } from '@/lib/emails/lead';

export type ContactInput = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  sujet: string;
  message: string;
  filesCount?: number;
};

export type ContactResult =
  | { ok: true; ref: string; emailed: boolean }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function genRef(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Server action : enregistre + notifie un message de contact. */
export async function submitContact(input: ContactInput): Promise<ContactResult> {
  if (!input.prenom?.trim() || !input.nom?.trim())
    return { ok: false, error: 'Nom et prénom requis.' };
  if (!EMAIL_RE.test(input.email ?? '')) return { ok: false, error: 'Email invalide.' };
  if ((input.message ?? '').trim().length < 20)
    return { ok: false, error: 'Message trop court (min. 20 caractères).' };

  const ref = genRef('MSG-CP');
  // TODO(upload): transmettre réellement les pièces jointes (storage + liens).
  // Pour l'instant on signale leur présence au gérant pour qu'il les demande.
  const filesNote = input.filesCount
    ? `\n\n[${input.filesCount} fichier(s) joint(s) par le client — à récupérer auprès de lui]`
    : '';

  const lead: Lead = {
    kind: 'contact',
    ref,
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: input.email.trim(),
    tel: input.tel?.trim() ?? '',
    sujet: input.sujet,
    message: input.message.trim() + filesNote,
  };

  try {
    const { emailed } = await sendLeadEmails(lead);
    return { ok: true, ref, emailed };
  } catch (err) {
    console.error('[submitContact] échec envoi:', err);
    return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' };
  }
}
