'use server';

// Exercice des droits RGPD : la demande arrive dans le BO (page Légal +
// boîte Demandes) comme les devis — décision Djemil 2026-08-18, le mailto
// seul ne suffit pas. Même hygiène que les autres intakes publics :
// sanitize + honeypot + TTL.

import { createDemandeIntake } from '@/lib/server/intake';
import { demandeExpiry } from '@/lib/demandes';
import { DROITS_RGPD, droitLabel } from '@/lib/rgpd';

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export async function submitDemandeDroit(input: {
  droit: string;
  nom: string;
  email: string;
  telephone?: string;
  message?: string;
  website?: string;
}): Promise<{ success: boolean; errors: Record<string, string> }> {
  // Honeypot : un humain ne remplit jamais ce champ → succès factice, rien créé.
  if (input.website && input.website.trim() !== '') return { success: true, errors: {} };

  const errors: Record<string, string> = {};
  const droit = sanitize(input.droit);
  const nom = sanitize(input.nom);
  const email = sanitize(input.email);
  const telephone = sanitize(input.telephone);
  const message = sanitize(input.message);

  if (!DROITS_RGPD.some((d) => d.key === droit)) errors.droit = 'Droit inconnu';
  if (!nom || nom.length > 100) errors.nom = 'Nom requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100)
    errors.email = 'Email invalide';
  if (telephone && !/^[0-9+\s().-]{8,20}$/.test(telephone)) errors.telephone = 'Téléphone invalide';
  if (message.length > 1000) errors.message = 'Message trop long (1000 caractères max)';
  if (Object.keys(errors).length > 0) return { success: false, errors };

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  await createDemandeIntake({
    type: 'rgpd',
    status: 'nouvelle',
    nom,
    email,
    telephone,
    message:
      `[Droit ${droitLabel(droit)}] ` +
      (message || 'Demande d’exercice de droit déposée depuis la page mentions légales.'),
    resourceRef: droit,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: demandeExpiry(nowMs),
  });
  return { success: true, errors: {} };
}
