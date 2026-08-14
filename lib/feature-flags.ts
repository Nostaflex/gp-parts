// Source de vérité des flags de visibilité des sections du site.
// Lu par le storefront (nav/home/footer/routes/sitemap) et écrit par le
// back-office (Server Action toggleFeatureFlags).

export type FeatureFlags = {
  pieces: boolean;
  location: boolean;
  venteVehicule: boolean;
  venteMoto: boolean;
  reparation: boolean;
  lavage: boolean;
};

// Défaut = tout visible : une lecture sur un Firestore non seedé ne casse
// jamais le site. L'état de lancement est posé explicitement (seed / BO).
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  pieces: true,
  location: true,
  venteVehicule: true,
  venteMoto: true,
  reparation: true,
  lavage: true,
};

/** Merge un doc Firestore (partiel/inconnu) sur les défauts, clés connues only. */
export function normalizeFeatureFlags(raw: Partial<FeatureFlags> | null | undefined): FeatureFlags {
  const src = raw ?? {};
  return {
    pieces: typeof src.pieces === 'boolean' ? src.pieces : DEFAULT_FEATURE_FLAGS.pieces,
    location: typeof src.location === 'boolean' ? src.location : DEFAULT_FEATURE_FLAGS.location,
    venteVehicule:
      typeof src.venteVehicule === 'boolean'
        ? src.venteVehicule
        : DEFAULT_FEATURE_FLAGS.venteVehicule,
    venteMoto: typeof src.venteMoto === 'boolean' ? src.venteMoto : DEFAULT_FEATURE_FLAGS.venteMoto,
    reparation:
      typeof src.reparation === 'boolean' ? src.reparation : DEFAULT_FEATURE_FLAGS.reparation,
    lavage: typeof src.lavage === 'boolean' ? src.lavage : DEFAULT_FEATURE_FLAGS.lavage,
  };
}

// Préfixe d'URL → flag qui le gouverne. Une route non listée = toujours
// visible (contact, a-propos, légales…).
const SECTION_FLAG_BY_PREFIX: { prefix: string; flag: keyof FeatureFlags }[] = [
  { prefix: '/pieces', flag: 'pieces' },
  { prefix: '/location', flag: 'location' },
  { prefix: '/vente-vehicule', flag: 'venteVehicule' },
  { prefix: '/vente-moto', flag: 'venteMoto' },
  { prefix: '/reparation', flag: 'reparation' },
  { prefix: '/lavage', flag: 'lavage' },
];

/** Un lien/route est-il visible selon les flags ? (gère query + sous-routes) */
export function isPathVisible(href: string, flags: FeatureFlags): boolean {
  const match = SECTION_FLAG_BY_PREFIX.find(
    (s) => href === s.prefix || href.startsWith(`${s.prefix}/`) || href.startsWith(`${s.prefix}?`)
  );
  return match ? flags[match.flag] : true;
}
