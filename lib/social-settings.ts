// Réglages des posts sociaux (hashtags par défaut, signature) — doc Firestore
// meta/socialSettings, écrit par le back-office (updateSocialSettings), lu par
// la page admin Posts sociaux. Jamais exposé côté storefront.

export type SocialSettings = {
  // Hashtags ajoutés à chaque post Instagram (séparés par des espaces).
  defaultHashtags: string;
  // Signature ajoutée en fin de post (nom + localisation, ex. contact).
  signature: string;
};

export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  defaultHashtags: '#CarPerformance #Guadeloupe #971 #VoitureOccasion',
  signature: 'Car Performance · Guadeloupe',
};

/** Merge un doc Firestore (partiel/inconnu) sur les défauts, clés connues only. */
export function normalizeSocialSettings(
  raw: Partial<SocialSettings> | null | undefined
): SocialSettings {
  const src = raw ?? {};
  return {
    defaultHashtags:
      typeof src.defaultHashtags === 'string'
        ? src.defaultHashtags
        : DEFAULT_SOCIAL_SETTINGS.defaultHashtags,
    signature:
      typeof src.signature === 'string' ? src.signature : DEFAULT_SOCIAL_SETTINGS.signature,
  };
}
