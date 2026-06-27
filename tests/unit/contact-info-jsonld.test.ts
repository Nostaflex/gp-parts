import { describe, it, expect } from 'vitest';
import { localBusinessJsonLd, organizationJsonLd } from '@/lib/seo';
import { normalizeContactInfo } from '@/lib/contact-info';

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
    expect(ld.geo.latitude).toBe(16.99);
    expect(ld.sameAs).toEqual(['https://fb.com/x']);
    expect(ld.openingHoursSpecification).toHaveLength(2);
  });

  it('organizationJsonLd reflète sameAs', () => {
    expect(organizationJsonLd(ci).sameAs).toEqual(['https://fb.com/x']);
  });
});
