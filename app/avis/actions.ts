'use server';

import { AvisDepotSchema } from '@/lib/schemas/avis';
import { createAvisIntake } from '@/lib/server/avis';

export type AvisSubmitResult = { ok: true } | { ok: false; error: string };

export type AvisSubmitInput = {
  prenom: string;
  note: number;
  texte: string;
  prestation: string;
  email: string;
  /** Honeypot — un humain ne le remplit jamais (champ caché). */
  website?: string;
};

export async function submitAvis(input: AvisSubmitInput): Promise<AvisSubmitResult> {
  // Honeypot rempli = bot : on répond OK sans rien écrire (silencieux côté
  // bot, mais logué côté serveur — jamais muet).
  if (input.website && input.website.trim() !== '') {
    console.warn('[avis] honeypot déclenché — dépôt ignoré');
    return { ok: true };
  }

  const parsed = AvisDepotSchema.safeParse({
    prenom: input.prenom,
    note: input.note,
    texte: input.texte,
    prestation: input.prestation,
    email: input.email ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Saisie invalide.' };
  }

  const now = new Date().toISOString();
  await createAvisIntake({
    ...parsed.data,
    status: 'nouveau', // JAMAIS de publication directe — modération BO obligatoire
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    reponsePro: '',
  });

  return { ok: true };
}
