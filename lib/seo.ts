// GP Parts — Source unique SEO : URL canonique, NAP (Name/Address/Phone),
// et constructeurs JSON-LD. Modifier ICI, jamais en dur dans les pages.
//
// ⚠️ Les valeurs marquées TODO(Stéphane) sont des placeholders : à remplacer
//    par les vraies infos avant la mise en production publique.
//
// Import TYPE-ONLY de ContactInfo : contact-info importe BUSINESS d'ici à
// l'eval ; n'importer ici que le type (effacé au runtime) évite un cycle.
import type { ContactInfo } from '@/lib/contact-info';

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

/** Liens réseaux non vides d'un ContactInfo (pour `sameAs` JSON-LD). */
function contactSameAs(ci: ContactInfo): string[] {
  return [ci.social.facebook, ci.social.instagram, ci.social.google].filter((u) => u.length > 0);
}

/** JSON-LD AutoRepair (LocalBusiness) — le levier #1 du SEO local. */
export function localBusinessJsonLd(ci: ContactInfo) {
  const social = contactSameAs(ci);
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    url: SITE_URL,
    image: absoluteUrl('/opengraph-image.png'),
    logo: absoluteUrl('/images/logo-carperformance.svg'),
    telephone: ci.phone,
    email: ci.email,
    priceRange: BUSINESS.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ci.address.street,
      postalCode: ci.address.postalCode,
      addressLocality: ci.address.city,
      addressRegion: ci.address.region,
      addressCountry: BUSINESS.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: ci.geo.lat, longitude: ci.geo.lng },
    areaServed: { '@type': 'AdministrativeArea', name: 'Guadeloupe' },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: ci.hours.weekdayOpen,
        closes: ci.hours.weekdayClose,
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: ci.hours.saturdayOpen,
        closes: ci.hours.saturdayClose,
      },
    ],
    ...(social.length ? { sameAs: social } : {}),
  };
}

/** JSON-LD Organization — alimente le knowledge panel. */
export function organizationJsonLd(ci: ContactInfo) {
  const social = contactSameAs(ci);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    url: SITE_URL,
    logo: absoluteUrl('/images/logo-carperformance.svg'),
    ...(social.length ? { sameAs: social } : {}),
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
