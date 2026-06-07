// GP Parts — Source unique SEO : URL canonique, NAP (Name/Address/Phone),
// et constructeurs JSON-LD. Modifier ICI, jamais en dur dans les pages.
//
// ⚠️ Les valeurs marquées TODO(Stéphane) sont des placeholders : à remplacer
//    par les vraies infos avant la mise en production publique.

// --- URL canonique du site ---
// TODO(Stéphane): définir le vrai domaine via NEXT_PUBLIC_SITE_URL (Vercel +
//   .env.local), ex: https://car-performance.gp. Défaut = preview Vercel.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gp-parts.vercel.app').replace(
  /\/$/,
  ''
);

/** Construit une URL absolue à partir d'un chemin relatif. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// --- NAP (Name / Address / Phone) — identique partout + Google Business ---
export const BUSINESS = {
  name: 'Car Performance',
  // TODO(Stéphane): vrai numéro de téléphone (format E.164 pour `phone`,
  //   format lisible pour `phoneDisplay`).
  phone: '+590590000000',
  phoneDisplay: '0590 00 00 00',
  // TODO(Stéphane): vraie adresse e-mail qui recevra les leads.
  email: 'contact@car-performance.gp',
  address: {
    street: 'Zone industrielle de Jarry',
    postalCode: '97122',
    city: 'Baie-Mahault',
    region: 'Guadeloupe',
    country: 'FR',
  },
  // TODO(Stéphane): coordonnées GPS exactes du garage (ici : centre de Jarry).
  geo: { lat: 16.2415, lng: -61.5611 },
  // TODO(Stéphane): liens réseaux (Facebook, Instagram, fiche Google Business).
  sameAs: [] as string[],
  // Horaires réels (cf. page d'accueil). Dimanche fermé → non listé.
  openingHours: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:30',
      closes: '17:30',
    },
    { days: ['Saturday'], opens: '08:00', closes: '13:00' },
  ],
  priceRange: '€€',
} as const;

/** Adresse formatée sur une ligne (réutilisable dans l'UI). */
export const ADDRESS_ONE_LINE = `${BUSINESS.address.street}, ${BUSINESS.address.postalCode} ${BUSINESS.address.city}, ${BUSINESS.address.region}`;

const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: BUSINESS.address.street,
  postalCode: BUSINESS.address.postalCode,
  addressLocality: BUSINESS.address.city,
  addressRegion: BUSINESS.address.region,
  addressCountry: BUSINESS.address.country,
};

/** JSON-LD AutoRepair (LocalBusiness) — le levier #1 du SEO local. */
export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    url: SITE_URL,
    image: absoluteUrl('/opengraph-image.png'),
    logo: absoluteUrl('/images/logo-carperformance.svg'),
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    address: postalAddress,
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng },
    areaServed: { '@type': 'AdministrativeArea', name: 'Guadeloupe' },
    openingHoursSpecification: BUSINESS.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    ...(BUSINESS.sameAs.length ? { sameAs: BUSINESS.sameAs } : {}),
  };
}

/** JSON-LD Organization — alimente le knowledge panel. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    url: SITE_URL,
    logo: absoluteUrl('/images/logo-carperformance.svg'),
    ...(BUSINESS.sameAs.length ? { sameAs: BUSINESS.sameAs } : {}),
  };
}

/** JSON-LD WebSite. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BUSINESS.name,
    inLanguage: 'fr-FR',
  };
}

/** JSON-LD BreadcrumbList à partir d'un fil d'Ariane (chemins relatifs). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
