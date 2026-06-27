'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { FeatureFlags } from '@/lib/feature-flags';
import { ContactInfoSchema } from '@/lib/contact-info';
import type { FormActionState } from '@/components/admin/FormShell';

export async function toggleFeatureFlags(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const checked = (k: string) => {
    const v = formData.get(k);
    return v != null && v !== '';
  };

  const flags: FeatureFlags = {
    pieces: checked('pieces'),
    location: checked('location'),
    venteMoto: checked('venteMoto'),
    reparation: checked('reparation'),
  };

  const db = getAdminFirestore();
  await db
    .doc('meta/featureFlags')
    .set({ ...flags, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'feature-flags',
    resourceId: 'featureFlags',
  });

  revalidateTag('feature-flags');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Visibilité des sections mise à jour.' };
}

export async function updateContactInfo(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const str = (k: string) => String(formData.get(k) ?? '').trim();
  const candidate = {
    phone: str('phone'),
    phoneDisplay: str('phoneDisplay'),
    email: str('email'),
    whatsappNumber: str('whatsappNumber'),
    address: {
      street: str('street'),
      postalCode: str('postalCode'),
      city: str('city'),
      region: str('region'),
    },
    hours: {
      weekdayOpen: str('weekdayOpen'),
      weekdayClose: str('weekdayClose'),
      saturdayOpen: str('saturdayOpen'),
      saturdayClose: str('saturdayClose'),
    },
    geo: { lat: Number(formData.get('lat')), lng: Number(formData.get('lng')) },
    social: { facebook: str('facebook'), instagram: str('instagram'), google: str('google') },
  };

  const parsed = ContactInfoSchema.safeParse(candidate);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const db = getAdminFirestore();
  await db
    .doc('meta/contactInfo')
    .set({ ...parsed.data, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'contact-info',
    resourceId: 'contactInfo',
  });

  revalidateTag('contact-info');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Coordonnées mises à jour.' };
}
