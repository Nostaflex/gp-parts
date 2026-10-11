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
  // Numéro WhatsApp pro de Car Performance (Djemil, 2026-10-05) : E.164 pour
  // `phone`, lisible pour `phoneDisplay`. Modifiable au BO → Coordonnées.
  phone: '+590690684307',
  phoneDisplay: '0690 68 43 07',
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

/**
 * Coordonnées encore égales aux valeurs par défaut du code (téléphone sentinelle,
 * e-mail sur un domaine inexistant) : rien de tout cela ne doit être publié aux
 * moteurs (SEO lot 1, 2026-10-11 ; P0.2 de l'audit du 19/08). Le BO Paramètres
 * est la seule source de vérité ; tant qu'il n'est pas renseigné, l'entité reste
 * muette sur ses coordonnées.
 */
export function isPlaceholderContactInfo(ci: ContactInfo): boolean {
  return ci.phone === BUSINESS.phone || ci.email === BUSINESS.email;
}

let placeholderWarned = false;

/** JSON-LD AutoRepair (LocalBusiness) — le levier #1 du SEO local. */
export function localBusinessJsonLd(ci: ContactInfo) {
  const social = contactSameAs(ci);
  const coords: {
    telephone?: string;
    email?: string;
    address?: {
      '@type': 'PostalAddress';
      streetAddress: string;
      postalCode: string;
      addressLocality: string;
      addressRegion: string;
      addressCountry: string;
    };
    geo?: { '@type': 'GeoCoordinates'; latitude: number; longitude: number };
  } = {};
  if (isPlaceholderContactInfo(ci)) {
    // Fail-open signalé : l'entité est publiée sans coordonnées, et on le dit.
    if (!placeholderWarned) {
      placeholderWarned = true;
      console.warn(
        '[seo] coordonnées non renseignées au BO (Paramètres > Coordonnées) : entité locale publiée sans téléphone, e-mail, adresse ni GPS.'
      );
    }
  } else {
    coords.telephone = ci.phone;
    coords.email = ci.email;
    coords.address = {
      '@type': 'PostalAddress',
      streetAddress: ci.address.street,
      postalCode: ci.address.postalCode,
      addressLocality: ci.address.city,
      addressRegion: ci.address.region,
      addressCountry: BUSINESS.address.country,
    };
    coords.geo = { '@type': 'GeoCoordinates', latitude: ci.geo.lat, longitude: ci.geo.lng };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    url: SITE_URL,
    image: absoluteUrl('/opengraph-image.png'),
    logo: absoluteUrl('/images/logo-carperformance.svg'),
    ...coords,
    priceRange: BUSINESS.priceRange,
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

export type ServiceOffer = { name: string; priceFromCents: number | null };

/**
 * JSON-LD Service relié à l'entité locale (SEO lot 1, 2026-10-11) : une page de
 * prestation (lavage, puis réparation) déclare ce qu'elle vend, où, et à partir
 * de combien. Prix TTC en euros, convention « à partir de » = minimum des tarifs.
 */
export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  offers?: ServiceOffer[];
}) {
  const offers = input.offers ?? [];
  const catalog: {
    hasOfferCatalog?: {
      '@type': 'OfferCatalog';
      name: string;
      itemListElement: Record<string, unknown>[];
    };
  } = {};
  if (offers.length) {
    catalog.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: input.name,
      itemListElement: offers.map((o) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: o.name },
        ...(o.priceFromCents != null
          ? { price: (o.priceFromCents / 100).toFixed(2), priceCurrency: 'EUR' }
          : {}),
      })),
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    serviceType: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: { '@type': 'AdministrativeArea', name: 'Guadeloupe' },
    ...catalog,
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
