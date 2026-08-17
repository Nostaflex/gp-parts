'use server';

import { createDemandeIntake } from '@/lib/server/intake';
import { sendLeadEmails } from '@/lib/emails/send';
import { demandeExpiry } from '@/lib/demandes';
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
  // Parcours distinct mécanique/carrosserie (retours Stéphane 2026-08-12).
  // Optionnels : un client sur l'ancien formulaire (onglet ouvert avant
  // déploiement) doit pouvoir soumettre sans ces champs.
  nature?: string;
  roulable?: string;
  sinistre?: string;
  // Carrosserie (réponse S2 Stéphane 2026-08-16) : plaque + kilométrage +
  // assurance + n° d'assuré suffisent pour le devis — pas de photos.
  kilometrage?: string;
  assurance?: string;
  numAssure?: string;
  type: string;
  description: string;
  date: string;
  creneau: string;
  website?: string;
};

export type LeadResult = { ok: true; ref: string; emailed: boolean } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[0-9\s+]{8,}$/;

function genRef(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Server action : persiste + notifie une demande de RDV réparation. */
export async function submitRdv(input: RdvInput): Promise<LeadResult> {
  // Honeypot : un humain ne remplit jamais ce champ → drop silencieux.
  if (input.website && input.website.trim() !== '') {
    return { ok: true, ref: genRef('RDV-CP'), emailed: false };
  }
  // Validation serveur (défense en profondeur — le client valide déjà).
  if (!input.prenom?.trim() || !input.nom?.trim())
    return { ok: false, error: 'Nom et prénom requis.' };
  if (!EMAIL_RE.test(input.email ?? '')) return { ok: false, error: 'Email invalide.' };
  if (!TEL_RE.test(input.tel ?? '')) return { ok: false, error: 'Téléphone invalide.' };
  if (!input.type || !input.description?.trim())
    return { ok: false, error: 'Prestation et description requises.' };
  if (!input.date || !input.creneau) return { ok: false, error: 'Date et créneau requis.' };

  const ref = genRef('RDV-CP');
  const vehiculeStr = [input.marque, input.modele, input.annee, input.immat]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ');

  const lead: Lead = {
    kind: 'rdv',
    ref,
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: input.email.trim(),
    tel: input.tel.trim(),
    vehicule: vehiculeStr,
    prestation: input.type,
    date: input.date,
    creneau: input.creneau,
    message: input.description.trim(),
  };

  // 1) Persister d'abord (le lead ne doit jamais être perdu).
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const natureLabel =
    input.nature === 'carrosserie'
      ? 'Carrosserie'
      : input.nature === 'mecanique'
        ? 'Panne / Mécanique'
        : null;
  const messageFull = [
    `Véhicule : ${vehiculeStr || '—'}`,
    ...(natureLabel ? [`Nature : ${natureLabel}`] : []),
    `Prestation : ${input.type}`,
    ...(input.roulable ? [`Véhicule roulable : ${input.roulable}`] : []),
    ...(input.kilometrage?.trim() ? [`Kilométrage : ${input.kilometrage.trim()} km`] : []),
    ...(input.sinistre ? [`Sinistre assurance : ${input.sinistre}`] : []),
    ...(input.assurance?.trim() ? [`Assurance : ${input.assurance.trim()}`] : []),
    ...(input.numAssure?.trim() ? [`N° d'assuré : ${input.numAssure.trim()}`] : []),
    `Date : ${input.date} · Créneau : ${input.creneau}`,
    '',
    input.description.trim(),
  ].join('\n');

  let persisted = false;
  try {
    await createDemandeIntake({
      type: 'reparation',
      status: 'nouvelle',
      nom: `${input.prenom.trim()} ${input.nom.trim()}`,
      email: input.email.trim(),
      telephone: input.tel.trim(),
      message: messageFull,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: demandeExpiry(now),
    });
    persisted = true;
  } catch (err) {
    console.error('[submitRdv] persistance échouée:', err);
  }

  // 2) Notifier par email (best-effort).
  let emailed = false;
  try {
    ({ emailed } = await sendLeadEmails(lead));
  } catch (err) {
    console.error('[submitRdv] échec envoi email (best-effort):', err);
  }

  if (!persisted && !emailed) {
    return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' };
  }
  return { ok: true, ref, emailed };
}
