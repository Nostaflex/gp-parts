'use client';

import { useActionState } from 'react';
import { updateContactInfo } from '@/app/admin/(shell)/parametres/actions';
import type { ContactInfo } from '@/lib/contact-info';
import type { FormActionState } from '@/components/admin/FormShell';

const FIELDS: { name: string; label: string; value: (c: ContactInfo) => string; type?: string }[] =
  [
    { name: 'phone', label: 'Téléphone (E.164, +590…)', value: (c) => c.phone },
    { name: 'phoneDisplay', label: 'Téléphone affiché', value: (c) => c.phoneDisplay },
    { name: 'email', label: 'Email', value: (c) => c.email, type: 'email' },
    { name: 'whatsappNumber', label: 'WhatsApp (sans +)', value: (c) => c.whatsappNumber },
    { name: 'street', label: 'Rue', value: (c) => c.address.street },
    { name: 'postalCode', label: 'Code postal', value: (c) => c.address.postalCode },
    { name: 'city', label: 'Ville', value: (c) => c.address.city },
    { name: 'region', label: 'Région', value: (c) => c.address.region },
    { name: 'weekdayOpen', label: 'Ouverture semaine', value: (c) => c.hours.weekdayOpen },
    { name: 'weekdayClose', label: 'Fermeture semaine', value: (c) => c.hours.weekdayClose },
    { name: 'saturdayOpen', label: 'Ouverture samedi', value: (c) => c.hours.saturdayOpen },
    { name: 'saturdayClose', label: 'Fermeture samedi', value: (c) => c.hours.saturdayClose },
    { name: 'lat', label: 'GPS latitude', value: (c) => String(c.geo.lat) },
    { name: 'lng', label: 'GPS longitude', value: (c) => String(c.geo.lng) },
    { name: 'facebook', label: 'Facebook (URL)', value: (c) => c.social.facebook },
    { name: 'instagram', label: 'Instagram (URL)', value: (c) => c.social.instagram },
    { name: 'google', label: 'Google Business (URL)', value: (c) => c.social.google },
  ];

export function ContactInfoForm({ initial }: { initial: ContactInfo }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateContactInfo,
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      {FIELDS.map((f) => (
        <label
          key={f.name}
          className="flex flex-col gap-1 text-body-sm"
          style={{ color: 'var(--text)' }}
        >
          <span>{f.label}</span>
          <input
            name={f.name}
            type={f.type ?? 'text'}
            defaultValue={f.value(initial)}
            aria-label={f.label}
            className="rounded-[10px] px-3 py-2"
            style={{ border: '1px solid rgba(198, 198, 200, 0.6)' }}
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {state?.ok && (
        <p role="status" style={{ color: 'var(--green)' }}>
          {state.message}
        </p>
      )}
      {state && 'errors' in state && state.errors && (
        <p role="alert" style={{ color: 'var(--red)' }}>
          Vérifiez les champs (format tél/email/URL).
        </p>
      )}
    </form>
  );
}
