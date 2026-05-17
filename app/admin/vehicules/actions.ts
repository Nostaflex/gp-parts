'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { VehiculeSchema } from '@/lib/schemas/vehicule';
import { computeDiff } from '@/lib/admin/diff';

import type { FormActionState } from '@/components/admin/FormShell';

function parseForm(formData: FormData) {
  const images = formData.getAll('images').map(String).filter(Boolean);
  const optionsRaw = String(formData.get('options') ?? '');
  const num = (k: string) => Number(formData.get(k));

  const carac = {
    puissance: String(formData.get('car_puissance') ?? '') || undefined,
    cylindree: String(formData.get('car_cylindree') ?? '') || undefined,
    consommation: String(formData.get('car_consommation') ?? '') || undefined,
    co2: String(formData.get('car_co2') ?? '') || undefined,
    couleur: String(formData.get('car_couleur') ?? '') || undefined,
    carrosserie: String(formData.get('car_carrosserie') ?? '') || undefined,
    critAir: String(formData.get('car_critair') ?? '') || undefined,
    premiereCirculation: String(formData.get('car_premiere_circulation') ?? '') || undefined,
    garantie: String(formData.get('car_garantie') ?? '') || undefined,
  };

  return {
    id: String(formData.get('id') ?? ''),
    type: String(formData.get('type') ?? ''),
    marque: String(formData.get('marque') ?? ''),
    modele: String(formData.get('modele') ?? ''),
    annee: num('annee'),
    km: num('km'),
    energie: String(formData.get('energie') ?? ''),
    transmission: String(formData.get('transmission') ?? ''),
    places: num('places'),
    options: optionsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    prix: num('prix'),
    mensualite: num('mensualite'),
    image: images[0] ?? '',
    images,
    description: String(formData.get('description') ?? ''),
    caracteristiques: carac,
    reference: String(formData.get('reference') ?? ''),
    disponibilite: String(formData.get('disponibilite') ?? ''),
    updatedAt: new Date().toISOString(),
  };
}

export async function createVehicule(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = VehiculeSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const db = getAdminFirestore();
  await db.doc(`vehicules/${data.id}`).set(data);

  await writeAuditLog({
    actor: session.email,
    action: 'create',
    resourceType: 'vehicule',
    resourceId: data.id,
  });

  revalidateTag('vehicules');
  revalidateTag(`vehicule:${data.id}`);
  redirect('/admin/vehicules');
}

export async function updateVehicule(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = VehiculeSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const clientUpdatedAt = String(formData.get('updatedAt') ?? '');

  const db = getAdminFirestore();
  const ref = db.doc(`vehicules/${data.id}`);

  let conflict = false;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }
    tx.update(ref, data);
    await writeAuditLog({
      actor: session.email,
      action: 'update',
      resourceType: 'vehicule',
      resourceId: data.id,
      diff: computeDiff(before, data as Record<string, unknown>),
    });
  });

  if (conflict) {
    return {
      errors: {
        _form: ['Ce véhicule a été modifié entre-temps. Rechargez la page.'],
      },
    };
  }

  revalidateTag('vehicules');
  revalidateTag(`vehicule:${data.id}`);
  return { ok: true, message: 'Véhicule mis à jour.' };
}

export async function deleteVehicule(id: string): Promise<FormActionState> {
  const session = await requireAdmin();

  const db = getAdminFirestore();
  await db.doc(`vehicules/${id}`).update({
    disponibilite: 'vendu',
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actor: session.email,
    action: 'delete',
    resourceType: 'vehicule',
    resourceId: id,
  });

  revalidateTag('vehicules');
  revalidateTag(`vehicule:${id}`);
  return { ok: true, message: 'Véhicule marqué comme vendu.' };
}
