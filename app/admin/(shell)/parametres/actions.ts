'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { FeatureFlags } from '@/lib/feature-flags';
import { ContactInfoSchema } from '@/lib/contact-info';
import { LegalInfoSchema } from '@/lib/legal-info';
import { z } from 'zod';
import { normalizeLocationSettings } from '@/lib/location-settings';
import { LocationNarrationSchema } from '@/lib/schemas/location';
import type { FormActionState } from '@/components/admin/FormShell';

export async function updateLocationSettings(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const num = (k: string) => Number(formData.get(k));
  const cents = (k: string) => Math.round(num(k) * 100);

  // normalize = même garde que la lecture : valeurs invalides → défauts.
  const settings = normalizeLocationSettings({
    ageMinimum: num('ageMinimum'),
    permisAncienneteMinAnnees: num('permisAncienneteMinAnnees'),
    surchargeJeuneActive: formData.get('surchargeJeuneActive') != null,
    surchargeJeuneEnCentsParJour: cents('surchargeJeune'),
    cautionsParCategorieEnCents: {
      Citadine: cents('cautionCitadine'),
      Berline: cents('cautionBerline'),
      SUV: cents('cautionSUV'),
      Utilitaire: cents('cautionUtilitaire'),
    },
  });

  // Narration de Max (Loca Lane) — même doc, champ `narration`. GARDE-FOU :
  // normalize a rempli `narration` avec les défauts ; sans le retirer, chaque
  // save des cautions écraserait les textes personnalisés. On n'écrit la
  // narration QUE si le formulaire l'a envoyée (champ vide accepté = retour
  // au défaut côté public).
  const { narration: _defauts, ...settingsSansNarration } = settings;
  let narrationEcrite: Record<string, string> | null = null;
  const narrationRaw = formData.get('narrationJson');
  if (narrationRaw != null) {
    let candidate: unknown;
    try {
      candidate = JSON.parse(String(narrationRaw));
    } catch {
      return { errors: { _form: ['Narration illisible — recharge la page et réessaie.'] } };
    }
    const parsed = LocationNarrationSchema.safeParse(candidate);
    if (!parsed.success) {
      return { errors: { _form: [...new Set(parsed.error.issues.map((i) => i.message))] } };
    }
    narrationEcrite = parsed.data;
  }

  await getAdminFirestore()
    .doc('meta/locationSettings')
    .set(
      {
        ...settingsSansNarration,
        ...(narrationEcrite ? { narration: narrationEcrite } : {}),
        updatedAt: Date.now(),
        updatedBy: session.email,
      },
      { merge: true }
    );

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'location-settings',
    resourceId: 'locationSettings',
  });

  revalidatePath('/location');
  return { ok: true, message: 'Réglages location enregistrés.' };
}

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
    venteVehicule: checked('venteVehicule'),
    venteMoto: checked('venteMoto'),
    reparation: checked('reparation'),
    lavage: checked('lavage'),
    avis: checked('avis'),
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

// Fiche d'identité légale (arbitrage A6) : TVA, médiateur, RC pro saisis par
// Stéphane quand il les obtient — la page légale bascule alors d'elle-même
// de « à fournir » à la vraie valeur.
export async function updateLegalInfo(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const str = (k: string) => String(formData.get(k) ?? '').trim();
  const parsed = LegalInfoSchema.safeParse({
    tvaIntracom: str('tvaIntracom'),
    mediateurNom: str('mediateurNom'),
    mediateurUrl: str('mediateurUrl'),
    rcPro: str('rcPro'),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const db = getAdminFirestore();
  await db
    .doc('meta/legalInfo')
    .set({ ...parsed.data, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'legal-info',
    resourceId: 'legalInfo',
  });

  revalidatePath('/mentions-legales');
  return { ok: true, message: 'Fiche légale mise à jour.' };
}

// Mode maintenance : le middleware (cache 30 s) et /maintenance lisent
// meta/maintenance — bascule effective en ≤ 30 s sur tout le site public.
const MaintenanceSchema = z.object({
  enabled: z.boolean(),
  titre: z.string().max(80),
  message: z.string().max(500),
});

export async function updateMaintenance(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = MaintenanceSchema.safeParse({
    enabled: formData.get('enabled') === 'on',
    titre: String(formData.get('titre') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const db = getAdminFirestore();
  await db
    .doc('meta/maintenance')
    .set({ ...parsed.data, updatedAt: Date.now(), updatedBy: session.email }, { merge: true });

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'maintenance',
    resourceId: 'maintenance',
  });

  revalidatePath('/', 'layout');
  return {
    ok: true,
    message: parsed.data.enabled
      ? 'Mode maintenance ACTIVÉ — le site public bascule sous 30 secondes.'
      : 'Mode maintenance désactivé — le site public revient sous 30 secondes.',
  };
}
