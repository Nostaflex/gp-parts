'use server';

import { createDemandeIntake } from '@/lib/server/intake';
import { sendLeadEmails } from '@/lib/emails/send';
import { demandeTypeFromSujet, demandeExpiry } from '@/lib/demandes';
import type { Lead } from '@/lib/emails/lead';

export type ContactInput = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  sujet: string;
  message: string;
  filesCount?: number;
  ref?: string;
  website?: string;
};

export type ContactResult =
  | { ok: true; ref: string; emailed: boolean }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function genRef(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Server action : persiste + notifie un message de contact. */
export async function submitContact(input: ContactInput): Promise<ContactResult> {
  // Honeypot : un humain ne remplit jamais ce champ → drop silencieux.
  if (input.website && input.website.trim() !== '') {
    return { ok: true, ref: genRef('MSG-CP'), emailed: false };
  }
  if (!input.prenom?.trim() || !input.nom?.trim())
    return { ok: false, error: 'Nom et prénom requis.' };
  if (!EMAIL_RE.test(input.email ?? '')) return { ok: false, error: 'Email invalide.' };
  if ((input.message ?? '').trim().length < 20)
    return { ok: false, error: 'Message trop court (min. 20 caractères).' };

  const ref = genRef('MSG-CP');
  // TODO(upload): transmettre réellement les pièces jointes (storage + liens).
  const filesNote = input.filesCount
    ? `\n\n[${input.filesCount} fichier(s) joint(s) par le client — à récupérer auprès de lui]`
    : '';
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const messageFull = `${input.message.trim()}\n\nSujet : ${input.sujet}${filesNote}`;

  // 1) Persister d'abord (le lead ne doit jamais être perdu).
  let persisted = false;
  try {
    await createDemandeIntake({
      type: demandeTypeFromSujet(input.sujet),
      status: 'nouvelle',
      nom: `${input.prenom.trim()} ${input.nom.trim()}`,
      email: input.email.trim(),
      telephone: input.tel?.trim() ?? '',
      message: messageFull,
      ...(input.ref ? { resourceRef: input.ref } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: demandeExpiry(now),
    });
    persisted = true;
  } catch (err) {
    console.error('[submitContact] persistance échouée:', err);
  }

  // 2) Notifier par email (best-effort).
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
  let emailed = false;
  try {
    ({ emailed } = await sendLeadEmails(lead));
  } catch (err) {
    console.error('[submitContact] échec envoi email (best-effort):', err);
  }

  if (!persisted && !emailed) {
    return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' };
  }
  return { ok: true, ref, emailed };
}
