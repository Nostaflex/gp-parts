// Génération des légendes de posts sociaux (Instagram / Facebook / WhatsApp)
// pour un véhicule ou une moto en vente. Chaque réseau a ses spécificités :
//  - Instagram : pas de lien cliquable en légende → « lien dans la bio »,
//    hashtags (max 30), légende max 2200 caractères.
//  - Facebook : lien direct vers la fiche, peu de hashtags.
//  - WhatsApp : message court avec *gras*, lien direct, prêt pour wa.me.
// Les dépassements de limites remontent en `warnings` (jamais silencieux).

import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';
import type { SocialSettings } from '@/lib/social-settings';
import { absoluteUrl } from '@/lib/seo';

export type SocialNetwork = 'instagram' | 'facebook' | 'whatsapp';

export type SocialItem = { kind: 'vehicule'; data: Vehicule } | { kind: 'moto'; data: Moto };

export type SocialPost = {
  caption: string;
  // URL absolue de la fiche — null pour Instagram (pas de lien en légende).
  url: string | null;
  charCount: number;
  hashtagCount: number;
  warnings: string[];
};

export const NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
};

export const INSTAGRAM_CAPTION_MAX = 2200;
export const INSTAGRAM_HASHTAGS_MAX = 30;

/** Chemin relatif de la fiche publique de l'annonce. */
export function fichePath(item: SocialItem): string {
  return item.kind === 'vehicule'
    ? `/vente-vehicule/${item.data.id}`
    : `/vente-moto/${item.data.id}`;
}

/** #PeugeotSw308 — alphanumérique only, jamais d'espace/tiret dans un hashtag. */
function toHashtag(text: string): string {
  const clean = text.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '');
  return clean.length > 0 ? `#${clean}` : '';
}

function prixLine(d: Vehicule | Moto): string {
  const prix = `${d.prix.toLocaleString('fr-FR')} €`;
  return d.mensualite > 0 ? `${prix} — ou ${d.mensualite} €/mois` : prix;
}

/** Corps commun : titre emoji, specs courtes, prix. */
function corps(item: SocialItem): string[] {
  const d = item.data;
  const emoji = item.kind === 'vehicule' ? '🚗' : '🏍️';
  const specs: string[] = [];
  if (d.km > 0) specs.push(`${d.km.toLocaleString('fr-FR')} km`);
  if (item.kind === 'vehicule') {
    specs.push(item.data.energie, item.data.transmission);
  } else {
    specs.push(item.data.categorie, item.data.energie);
  }

  const lines: string[] = [];
  lines.push(`${emoji} ${d.marque} ${d.modele} · ${d.annee}${d.type === 'neuf' ? ' — NEUF' : ''}`);
  lines.push(`✅ ${specs.join(' · ')}`);
  lines.push(`💶 ${prixLine(d)}`);
  lines.push('🛡️ Contrôlé & garanti — financement possible');
  return lines;
}

export function generateSocialPost(
  item: SocialItem,
  network: SocialNetwork,
  settings: SocialSettings
): SocialPost {
  const d = item.data;
  const url = absoluteUrl(fichePath(item));
  const warnings: string[] = [];
  const lines = corps(item);

  let hashtags: string[] = [];
  if (network === 'instagram') {
    lines.push('');
    lines.push('📲 Lien dans la bio ou envoyez-nous un message');
    if (settings.signature) lines.push(settings.signature);
    hashtags = [
      ...settings.defaultHashtags.split(/\s+/).filter((h) => h.startsWith('#')),
      toHashtag(d.marque),
      toHashtag(`${d.marque} ${d.modele}`),
    ].filter((h, i, arr) => h !== '' && arr.indexOf(h) === i);
    if (hashtags.length > INSTAGRAM_HASHTAGS_MAX) {
      warnings.push(
        `${hashtags.length} hashtags — Instagram en accepte ${INSTAGRAM_HASHTAGS_MAX} max.`
      );
    }
    lines.push('');
    lines.push(hashtags.join(' '));
  } else if (network === 'facebook') {
    lines.push('');
    lines.push(`👉 Toutes les infos et photos : ${url}`);
    if (settings.signature) lines.push(settings.signature);
    hashtags = settings.defaultHashtags
      .split(/\s+/)
      .filter((h) => h.startsWith('#'))
      .slice(0, 3);
    if (hashtags.length > 0) {
      lines.push('');
      lines.push(hashtags.join(' '));
    }
  } else {
    // WhatsApp : court, *gras* natif, lien direct.
    lines.length = 0;
    const emoji = item.kind === 'vehicule' ? '🚗' : '🏍️';
    lines.push(`${emoji} *${d.marque} ${d.modele} · ${d.annee}*`);
    lines.push(`💶 ${prixLine(d)}`);
    lines.push(`👉 ${url}`);
    if (settings.signature) lines.push(settings.signature);
  }

  const caption = lines.join('\n');
  if (network === 'instagram' && caption.length > INSTAGRAM_CAPTION_MAX) {
    warnings.push(
      `Légende de ${caption.length} caractères — Instagram tronque au-delà de ${INSTAGRAM_CAPTION_MAX}.`
    );
  }

  return {
    caption,
    url: network === 'instagram' ? null : url,
    charCount: caption.length,
    hashtagCount: hashtags.length,
    warnings,
  };
}
