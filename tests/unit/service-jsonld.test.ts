import { describe, it, expect } from 'vitest';
import { serviceJsonLd, SITE_URL } from '@/lib/seo';

/**
 * Lot 1 SEO : la page lavage (SPLASH) publie un Service relié à l'entité
 * locale, avec un catalogue d'offres « à partir de » quand des tarifs existent.
 */
describe('serviceJsonLd', () => {
  it('relie le service à l’entité locale et à l’URL de la page', () => {
    const ld = serviceJsonLd({
      name: 'SPLASH — esthétique automobile',
      description: 'Lavage et esthétique automobile premium en Guadeloupe.',
      path: '/lavage',
      offers: [],
    });
    expect(ld['@type']).toBe('Service');
    expect(ld.provider).toEqual({ '@id': `${SITE_URL}/#business` });
    expect(ld.url).toBe(`${SITE_URL}/lavage`);
    expect(ld.areaServed).toEqual({ '@type': 'AdministrativeArea', name: 'Guadeloupe' });
    expect('hasOfferCatalog' in ld).toBe(false);
  });

  it('publie un OfferCatalog avec le prix minimum TTC en euros', () => {
    const ld = serviceJsonLd({
      name: 'SPLASH',
      description: 'x',
      path: '/lavage',
      offers: [
        { name: 'Premium Wash', priceFromCents: 4900 },
        { name: 'Sur devis', priceFromCents: null },
      ],
    });
    const items = ld.hasOfferCatalog?.itemListElement ?? [];
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: 'Premium Wash' },
      price: '49.00',
      priceCurrency: 'EUR',
    });
    expect(items[1]).toMatchObject({ itemOffered: { name: 'Sur devis' } });
    expect('price' in items[1]).toBe(false);
  });
});
