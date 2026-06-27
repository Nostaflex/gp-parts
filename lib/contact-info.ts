// Coordonnées du garage : lues par le storefront + le JSON-LD, éditées au BO.
// Source de défauts = BUSINESS (lib/seo) ; l'override vient de Firestore.
import { z } from 'zod';
import { BUSINESS } from '@/lib/seo';
import { WHATSAPP_NUMBER } from '@/lib/config';

export type ContactInfo = {
  phone: string;
  phoneDisplay: string;
  email: string;
  whatsappNumber: string;
  address: { street: string; postalCode: string; city: string; region: string };
  hours: { weekdayOpen: string; weekdayClose: string; saturdayOpen: string; saturdayClose: string };
  geo: { lat: number; lng: number };
  social: { facebook: string; instagram: string; google: string };
};

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  phone: BUSINESS.phone,
  phoneDisplay: BUSINESS.phoneDisplay,
  email: BUSINESS.email,
  whatsappNumber: WHATSAPP_NUMBER,
  address: {
    street: BUSINESS.address.street,
    postalCode: BUSINESS.address.postalCode,
    city: BUSINESS.address.city,
    region: BUSINESS.address.region,
  },
  hours: {
    weekdayOpen: '07:30',
    weekdayClose: '17:30',
    saturdayOpen: '08:00',
    saturdayClose: '13:00',
  },
  geo: { lat: BUSINESS.geo.lat, lng: BUSINESS.geo.lng },
  social: { facebook: '', instagram: '', google: '' },
};

const isStr = (v: unknown): v is string => typeof v === 'string';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function normalizeContactInfo(raw: DeepPartial<ContactInfo> | null | undefined): ContactInfo {
  const d = DEFAULT_CONTACT_INFO;
  const s = raw ?? {};
  return {
    phone: isStr(s.phone) ? s.phone : d.phone,
    phoneDisplay: isStr(s.phoneDisplay) ? s.phoneDisplay : d.phoneDisplay,
    email: isStr(s.email) ? s.email : d.email,
    whatsappNumber: isStr(s.whatsappNumber) ? s.whatsappNumber : d.whatsappNumber,
    address: {
      street: isStr(s.address?.street) ? s.address!.street : d.address.street,
      postalCode: isStr(s.address?.postalCode) ? s.address!.postalCode : d.address.postalCode,
      city: isStr(s.address?.city) ? s.address!.city : d.address.city,
      region: isStr(s.address?.region) ? s.address!.region : d.address.region,
    },
    hours: {
      weekdayOpen: isStr(s.hours?.weekdayOpen) ? s.hours!.weekdayOpen : d.hours.weekdayOpen,
      weekdayClose: isStr(s.hours?.weekdayClose) ? s.hours!.weekdayClose : d.hours.weekdayClose,
      saturdayOpen: isStr(s.hours?.saturdayOpen) ? s.hours!.saturdayOpen : d.hours.saturdayOpen,
      saturdayClose: isStr(s.hours?.saturdayClose) ? s.hours!.saturdayClose : d.hours.saturdayClose,
    },
    geo: {
      lat: typeof s.geo?.lat === 'number' ? s.geo!.lat : d.geo.lat,
      lng: typeof s.geo?.lng === 'number' ? s.geo!.lng : d.geo.lng,
    },
    social: {
      facebook: isStr(s.social?.facebook) ? s.social!.facebook : d.social.facebook,
      instagram: isStr(s.social?.instagram) ? s.social!.instagram : d.social.instagram,
      google: isStr(s.social?.google) ? s.social!.google : d.social.google,
    },
  };
}

export function addressOneLine(ci: ContactInfo): string {
  const a = ci.address;
  return `${a.street}, ${a.postalCode} ${a.city}, ${a.region}`;
}

export function whatsappUrl(ci: ContactInfo): string {
  return `https://wa.me/${ci.whatsappNumber}`;
}

export function openingHoursSpec(
  ci: ContactInfo
): { days: string[]; opens: string; closes: string }[] {
  return [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: ci.hours.weekdayOpen,
      closes: ci.hours.weekdayClose,
    },
    { days: ['Saturday'], opens: ci.hours.saturdayOpen, closes: ci.hours.saturdayClose },
  ];
}

export function sameAs(ci: ContactInfo): string[] {
  return [ci.social.facebook, ci.social.instagram, ci.social.google].filter((u) => u.length > 0);
}

const urlOrEmpty = z.string().refine((v) => v === '' || /^https?:\/\/.+/.test(v), {
  message: 'URL invalide',
});

export const ContactInfoSchema = z.object({
  phone: z.string().regex(/^\+\d{6,}$/, 'Téléphone E.164 invalide (ex +590690112233)'),
  phoneDisplay: z.string().min(1),
  email: z.string().email(),
  whatsappNumber: z.string().regex(/^\d{6,}$/, 'Numéro WhatsApp invalide'),
  address: z.object({
    street: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    region: z.string().min(1),
  }),
  hours: z.object({
    weekdayOpen: z.string().regex(/^\d{2}:\d{2}$/),
    weekdayClose: z.string().regex(/^\d{2}:\d{2}$/),
    saturdayOpen: z.string().regex(/^\d{2}:\d{2}$/),
    saturdayClose: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  geo: z.object({ lat: z.number().finite(), lng: z.number().finite() }),
  social: z.object({ facebook: urlOrEmpty, instagram: urlOrEmpty, google: urlOrEmpty }),
});
