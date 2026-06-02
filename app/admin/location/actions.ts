'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { LocationCarWriteSchema } from '@/lib/schemas/location-car';
import { computeDiff } from '@/lib/admin/diff';

import type { FormActionState } from '@/components/admin/FormShell';

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// euros (string du form) → centimes entiers ; NaN → NaN (rejeté par Zod int).
function eurosToCents(raw: FormDataEntryValue | null): number {
  const euros = Number(raw);
  if (!Number.isFinite(euros)) return NaN;
  return Math.round(euros * 100);
}

function parseForm(formData: FormData) {
  const images = formData.getAll('images').map(String).filter(Boolean);
  return {
    id: sanitize(formData.get('id')),
    marque: sanitize(formData.get('marque')),
    modele: sanitize(formData.get('modele')),
    categorie: String(formData.get('categorie') ?? ''),
    places: Number(formData.get('places')),
    transmission: sanitize(formData.get('transmission')),
    carburant: sanitize(formData.get('carburant')),
    prixJourEnCents: eurosToCents(formData.get('prixJour')),
    prixSemaineEnCents: eurosToCents(formData.get('prixSemaine')),
    disponible: formData.get('disponible') === 'true',
    image: images[0] ?? '',
    reference: sanitize(formData.get('reference')),
    updatedAt: new Date().toISOString(),
  };
}

function revalidateLocation(): void {
  revalidateTag('location-cars');
  revalidatePath('/location');
}

export async function createLocationCar(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = LocationCarWriteSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const db = getAdminFirestore();
  await db.doc(`location-cars/${data.id}`).set({ ...data, deletedAt: null });

  await writeAuditLog({
    actor: session.email,
    action: 'create',
    resourceType: 'location-car',
    resourceId: data.id,
  });

  revalidateLocation();
  redirect('/admin/location');
}

export async function updateLocationCar(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = LocationCarWriteSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const clientUpdatedAt = String(formData.get('clientUpdatedAt') ?? '');

  const db = getAdminFirestore();
  const ref = db.doc(`location-cars/${data.id}`);

  let conflict = false;
  let auditDiff: Record<string, { before: unknown; after: unknown }> = {};
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }
    tx.update(ref, data);
    auditDiff = computeDiff(before, data as Record<string, unknown>);
  });

  if (conflict) {
    return {
      errors: { _form: ['Cette voiture a été modifiée entre-temps. Rechargez la page.'] },
    };
  }

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'location-car',
    resourceId: data.id,
    diff: auditDiff,
  });

  revalidateLocation();
  return { ok: true, message: 'Voiture mise à jour.' };
}

export async function deleteLocationCar(id: string): Promise<FormActionState> {
  const session = await requireAdmin();

  const db = getAdminFirestore();
  await db.doc(`location-cars/${id}`).update({
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actor: session.email,
    action: 'delete',
    resourceType: 'location-car',
    resourceId: id,
  });

  revalidateLocation();
  return { ok: true, message: 'Voiture supprimée.' };
}
