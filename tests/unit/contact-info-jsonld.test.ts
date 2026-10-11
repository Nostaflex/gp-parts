import { describe, it, expect } from 'vitest';
import { localBusinessJsonLd, organizationJsonLd } from '@/lib/seo';
import { normalizeContactInfo, isPlaceholderContactInfo } from '@/lib/contact-info';

describe('JSON-LD reflète ContactInfo', () => {
  const ci = normalizeContactInfo({
    phone: '+590690112233',
    email: 'x@y.gp',
    geo: { lat: 16.99, lng: -61.99 },
    social: { facebook: 'https://fb.com/x', instagram: '', google: '' },
  });

  it('localBusinessJsonLd reflète téléphone/email/geo/sameAs', () => {
    const ld = localBusinessJsonLd(ci);
    expect(ld.telephone).toBe('+590690112233');
    expect(ld.email).toBe('x@y.gp');
    expect(ld.geo?.latitude).toBe(16.99);
    expect(ld.sameAs).toEqual(['https://fb.com/x']);
    expect(ld.openingHoursSpecification).toHaveLength(2);
  });

  it('organizationJsonLd reflète sameAs', () => {
    expect(organizationJsonLd(ci).sameAs).toEqual(['https://fb.com/x']);
  });
});

/**
 * Lot 1 SEO (P0.2 de l'audit du 19/08) : tant que les coordonnées du BO sont
 * les valeurs par défaut du code, l'entité locale ne publie ni téléphone, ni
 * e-mail, ni adresse, ni GPS aux moteurs (fail-open, avec avertissement).
 */
describe('garde anti-placeholder de l’entité locale', () => {
  it('les défauts du code sont reconnus comme des placeholders', () => {
    expect(isPlaceholderContactInfo(normalizeContactInfo({}))).toBe(true);
    expect(
      isPlaceholderContactInfo(
        normalizeContactInfo({ phone: '+590690112233', email: 'contact@car-performance.biz' })
      )
    ).toBe(false);
  });

  it('JSON-LD sans coordonnées fictives', () => {
    const ld = localBusinessJsonLd(normalizeContactInfo({}));
    expect(ld.name).toBe('Car Performance');
    expect('telephone' in ld).toBe(false);
    expect('email' in ld).toBe(false);
    expect('address' in ld).toBe(false);
    expect('geo' in ld).toBe(false);
  });

  it('JSON-LD complet dès que les coordonnées sont réelles', () => {
    const ld = localBusinessJsonLd(
      normalizeContactInfo({ phone: '+590690112233', email: 'contact@car-performance.biz' })
    );
    expect(ld.telephone).toBe('+590690112233');
    expect(ld.email).toBe('contact@car-performance.biz');
    expect(ld.address).toBeDefined();
    expect(ld.geo).toBeDefined();
  });
});
