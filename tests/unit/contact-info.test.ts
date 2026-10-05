import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONTACT_INFO,
  normalizeContactInfo,
  addressOneLine,
  whatsappUrl,
  openingHoursSpec,
  sameAs,
  ContactInfoSchema,
  normalizePhone,
  normalizeWhatsapp,
} from '@/lib/contact-info';

describe('contact-info', () => {
  it('défauts cohérents (champs requis présents)', () => {
    expect(DEFAULT_CONTACT_INFO.phone.startsWith('+')).toBe(true);
    expect(DEFAULT_CONTACT_INFO.address.city).toBeTruthy();
    expect(DEFAULT_CONTACT_INFO.hours.weekdayOpen).toMatch(/^\d{2}:\d{2}$/);
    expect(typeof DEFAULT_CONTACT_INFO.geo.lat).toBe('number');
    expect(DEFAULT_CONTACT_INFO.social).toEqual({ facebook: '', instagram: '', google: '' });
  });

  it('normalize merge un doc partiel sur les défauts', () => {
    const r = normalizeContactInfo({ email: 'x@y.gp', social: { facebook: 'https://fb.com/x' } });
    expect(r.email).toBe('x@y.gp');
    expect(r.phone).toBe(DEFAULT_CONTACT_INFO.phone);
    expect(r.social.facebook).toBe('https://fb.com/x');
    expect(r.social.instagram).toBe('');
  });

  it('normalize null/undefined → défauts', () => {
    expect(normalizeContactInfo(null)).toEqual(DEFAULT_CONTACT_INFO);
    expect(normalizeContactInfo(undefined)).toEqual(DEFAULT_CONTACT_INFO);
  });

  it('addressOneLine', () => {
    const ci = normalizeContactInfo({
      address: { street: 'Rue A', postalCode: '97110', city: 'Pointe', region: 'Guadeloupe' },
    });
    expect(addressOneLine(ci)).toBe('Rue A, 97110 Pointe, Guadeloupe');
  });

  it('whatsappUrl', () => {
    const ci = normalizeContactInfo({ whatsappNumber: '590690112233' });
    expect(whatsappUrl(ci)).toBe('https://wa.me/590690112233');
  });

  // Fiche prod du 2026-10-05 : WhatsApp saisi « 0690684307 » → wa.me refusait
  // le lien (il lui faut l'indicatif), téléphone resté au numéro d'exemple.
  it('whatsappUrl accepte un numéro saisi à la locale (Guadeloupe → indicatif 590)', () => {
    for (const saisie of ['0690684307', '0690 68 43 07', '+590 690 68 43 07', '590690684307']) {
      expect(whatsappUrl(normalizeContactInfo({ whatsappNumber: saisie }))).toBe(
        'https://wa.me/590690684307'
      );
    }
  });

  it('normalizeWhatsapp / normalizePhone : une saisie locale devient internationale', () => {
    expect(normalizeWhatsapp('0690 68 43 07')).toBe('590690684307');
    expect(normalizePhone('0690 68 43 07')).toBe('+590690684307');
    expect(normalizePhone('06.90.68.43.07')).toBe('+590690684307');
    expect(normalizePhone('590690684307')).toBe('+590690684307');
    expect(normalizePhone('+590690684307')).toBe('+590690684307');
    // Un numéro d'un autre pays, déjà international, n'est pas touché.
    expect(normalizePhone('+33612345678')).toBe('+33612345678');
    expect(normalizeWhatsapp('33612345678')).toBe('33612345678');
  });

  it('les coordonnées par défaut sont le vrai numéro de Car Performance', () => {
    expect(DEFAULT_CONTACT_INFO.phone).toBe('+590690684307');
    expect(DEFAULT_CONTACT_INFO.phoneDisplay).toBe('0690 68 43 07');
  });

  it('openingHoursSpec → 2 plages schema.org', () => {
    const spec = openingHoursSpec(DEFAULT_CONTACT_INFO);
    expect(spec).toHaveLength(2);
    expect(spec[0].days).toContain('Monday');
    expect(spec[1].days).toEqual(['Saturday']);
  });

  it('sameAs filtre les liens vides', () => {
    const ci = normalizeContactInfo({
      social: { facebook: 'https://fb.com/x', instagram: '', google: 'https://g.page/x' },
    });
    expect(sameAs(ci)).toEqual(['https://fb.com/x', 'https://g.page/x']);
  });

  it('ContactInfoSchema rejette email/tel invalides, accepte social vide', () => {
    const base = {
      phone: '+590690112233',
      phoneDisplay: '0690 11 22 33',
      email: 'contact@car.gp',
      whatsappNumber: '590690112233',
      address: { street: 'R', postalCode: '97110', city: 'P', region: 'Guadeloupe' },
      hours: {
        weekdayOpen: '07:30',
        weekdayClose: '17:30',
        saturdayOpen: '08:00',
        saturdayClose: '13:00',
      },
      geo: { lat: 16.2, lng: -61.5 },
      social: { facebook: '', instagram: '', google: '' },
    };
    expect(ContactInfoSchema.safeParse(base).success).toBe(true);
    expect(ContactInfoSchema.safeParse({ ...base, email: 'pasunemail' }).success).toBe(false);
    expect(ContactInfoSchema.safeParse({ ...base, phone: '0690' }).success).toBe(false);
    expect(
      ContactInfoSchema.safeParse({
        ...base,
        social: { facebook: 'pasurl', instagram: '', google: '' },
      }).success
    ).toBe(false);
  });
});
