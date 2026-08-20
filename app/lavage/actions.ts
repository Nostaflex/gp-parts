'use server';

import { createDemandeIntake } from '@/lib/server/intake';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { sendLeadEmails } from '@/lib/emails/send';
import { demandeExpiry } from '@/lib/demandes';
import { CRENEAUX_LAVAGE, DISPO_HORIZON_JOURS, isDateKey } from '@/lib/lavage-creneaux';
import { getPrisEffectifs } from '@/lib/server/lavage-dispos';
import { getCachedLavageSettings } from '@/lib/data/lavage-settings-cache';
import { localDateISO } from '@/lib/utils';
import type { Lead } from '@/lib/emails/lead';
import type { LeadResult } from '@/app/reparation/actions';

export type LavageInput = {
  marketingOptIn?: boolean;
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  marque: string;
  modele: string;
  formule: string;
  /** Gabarit tarifaire (Citadine, Gamme B, SUV…) — optionnel : une formule
   * à tarif unique ou « Sur devis » n'en a pas. */
  gabarit?: string;
  date: string;
  creneau: string;
  message: string;
  website?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[0-9\s+]{8,}$/;

// Longueurs maximales par champ (audit 2026-08-20) — miroir des caps de
// saisie du BO (zod) : le client valide, le serveur borne aussi.
const CAPS: readonly [keyof LavageInput, number][] = [
  ['prenom', 60],
  ['nom', 60],
  ['email', 120],
  ['tel', 20],
  ['marque', 40],
  ['modele', 40],
  ['formule', 40],
  ['gabarit', 30],
  ['message', 1000],
];

function genRef(): string {
  return `LAV-CP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Server action : persiste + notifie une demande de RDV lavage. */
export async function submitLavage(input: LavageInput): Promise<LeadResult> {
  const rl = await checkRateLimit('lavage');
  if (!rl.ok) return { ok: false, error: rl.message };
  // Honeypot : un humain ne remplit jamais ce champ → drop silencieux.
  if (input.website && input.website.trim() !== '') {
    return { ok: true, ref: genRef(), emailed: false };
  }
  if (!input.prenom?.trim() || !input.nom?.trim())
    return { ok: false, error: 'Nom et prénom requis.' };
  if (!EMAIL_RE.test(input.email ?? '')) return { ok: false, error: 'Email invalide.' };
  if (!TEL_RE.test(input.tel ?? '')) return { ok: false, error: 'Téléphone invalide.' };
  if (!input.formule) return { ok: false, error: 'Formule requise.' };
  if (!input.date || !input.creneau) return { ok: false, error: 'Date et créneau requis.' };

  // Longueurs bornées : rien d'arbitraire ne part vers Firestore ni l'email.
  for (const [k, max] of CAPS) {
    const v = input[k];
    if (typeof v === 'string' && v.length > max)
      return { ok: false, error: 'Saisie trop longue — vérifiez vos champs.' };
  }

  // Date exploitable, à venir, dans l'horizon de gestion (le BO ne peut rien
  // bloquer au-delà — une demande hors horizon serait ingérable).
  if (!isDateKey(input.date)) return { ok: false, error: 'Date invalide.' };
  if (input.date < localDateISO(0))
    return { ok: false, error: 'Cette date est passée — choisissez un jour à venir.' };
  if (input.date > localDateISO(DISPO_HORIZON_JOURS))
    return { ok: false, error: 'Date trop lointaine — choisissez un jour plus proche.' };

  // Créneau et formule validés contre les RÉFÉRENTIELS, pas contre le client
  // (audit 2026-08-20 : n'importe quelle chaîne partait dans le lead/BO).
  if (!(CRENEAUX_LAVAGE as readonly string[]).includes(input.creneau))
    return { ok: false, error: 'Créneau inconnu — rechargez la page et réessayez.' };
  // getCachedLavageSettings est fail-open (défauts = gamme réelle de
  // Stéphane) : en cas de panne de lecture, une formule fraîchement créée au
  // BO peut être refusée ici — refus EXPLICITE, jamais un lead corrompu.
  const { formules } = await getCachedLavageSettings();
  const formuleRef = formules.find((f) => f.nom === input.formule);
  if (!formuleRef)
    return { ok: false, error: 'Formule inconnue — rechargez la page et réessayez.' };
  if (formuleRef.tarifs.length > 1 && !formuleRef.tarifs.some((t) => t.label === input.gabarit))
    return { ok: false, error: 'Choisissez le type de véhicule pour cette formule.' };

  // Créneau déjà bloqué (RDV confirmé ou blocage manuel) → refus explicite.
  // Fail-open sur erreur de lecture : un lead ne se perd jamais sur une panne
  // de dispo — la demande passe, Stéphane arbitre. Jamais muet.
  try {
    const effectifs = await getPrisEffectifs([input.date]);
    if ((effectifs[input.date] ?? []).includes(input.creneau)) {
      return {
        ok: false,
        error: 'Ce créneau vient d’être réservé — choisissez un autre horaire.',
      };
    }
  } catch (err) {
    console.warn('[submitLavage] lecture dispos échouée (fail-open):', err);
  }

  const ref = genRef();
  const vehiculeStr = [input.marque, input.modele]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ');

  const lead: Lead = {
    kind: 'lavage',
    ref,
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: input.email.trim(),
    tel: input.tel.trim(),
    vehicule: vehiculeStr,
    prestation: `Esthétique — ${input.formule}${input.gabarit?.trim() ? ` (${input.gabarit.trim()})` : ''}`,
    date: input.date,
    creneau: input.creneau,
    message: input.message.trim(),
  };

  // 1) Persister d'abord (le lead ne doit jamais être perdu).
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const messageFull = [
    `Véhicule : ${vehiculeStr || '—'}`,
    `Formule : ${input.formule}${input.gabarit?.trim() ? ` — ${input.gabarit.trim()}` : ''}`,
    `Date : ${input.date} · Créneau : ${input.creneau}`,
    '',
    input.message.trim(),
  ].join('\n');

  let persisted = false;
  try {
    await createDemandeIntake({
      type: 'lavage',
      status: 'nouvelle',
      nom: `${input.prenom.trim()} ${input.nom.trim()}`,
      email: input.email.trim(),
      telephone: input.tel.trim(),
      message: messageFull,
      marketingOptIn: Boolean(input.marketingOptIn),
      // RDV structuré → blocage 1-tap du créneau au BO.
      ...(isDateKey(input.date) ? { rdvDate: input.date, rdvCreneau: input.creneau } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: demandeExpiry(now),
    });
    persisted = true;
  } catch (err) {
    console.error('[submitLavage] persistance échouée:', err);
  }

  // 2) Notifier par email (best-effort).
  let emailed = false;
  try {
    ({ emailed } = await sendLeadEmails(lead));
  } catch (err) {
    console.error('[submitLavage] échec envoi email (best-effort):', err);
  }

  if (!persisted && !emailed) {
    return { ok: false, error: 'Envoi impossible pour le moment. Réessayez ou appelez-nous.' };
  }
  return { ok: true, ref, emailed };
}
