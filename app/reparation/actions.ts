'use server';

import { sendLeadEmails } from '@/lib/emails/send';
import type { Lead } from '@/lib/emails/lead';

export type RdvInput = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  marque: string;
  modele: string;
  annee: string;
  immat: string;
  type: string;
  description: string;
  date: string;
  creneau: string;
};

export type LeadResult = { ok: true; ref: string; emailed: boolean } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[0-9\s+]{8,}$/;

function genRef(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Server action : enregistre + notifie une demande de RDV réparation. */
export async function submitRdv(input: RdvInput): Promise<LeadResult> {
  // Validation serveur (défense en profondeur — le client valide déjà).
  if (!input.prenom?.trim() || !input.nom?.trim())
    return { ok: false, error: 'Nom et prénom requis.' };
  if (!EMAIL_RE.test(input.email ?? '')) return { ok: false, error: 'Email invalide.' };
  if (!TEL_RE.test(input.tel ?? '')) return { ok: false, error: 'Téléphone invalide.' };
  if (!input.type || !input.description?.trim())
    return { ok: false, error: 'Prestation et description requises.' };
  if (!input.date || !input.creneau) return { ok: false, error: 'Date et créneau requis.' };

  const ref = genRef('RDV-CP');
  const lead: Lead = {
    kind: 'rdv',
    ref,
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: input.email.trim(),
    tel: input.tel.trim(),
    vehicule: [input.marque, input.modele, input.annee, input.immat]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(' '),
    prestation: input.type,
    date: input.date,
    creneau: input.creneau,
    message: input.description.trim(),
  };

  try {
    const { emailed } = await sendLeadEmails(lead);
    return { ok: true, ref, emailed };
  } catch (err) {
    console.error('[submitRdv] échec envoi:', err);
    // Le lead n'est pas perdu côté UX : on renvoie une erreur claire.
    return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' };
  }
}
