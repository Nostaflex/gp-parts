'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { VehiculeSchema } from '@/lib/schemas/vehicule';
import { computeDiff } from '@/lib/admin/diff';

import type { FormActionState } from '@/components/admin/FormShell';

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function parseForm(formData: FormData) {
  const images = formData.getAll('images').map(String).filter(Boolean);
  const optionsRaw = String(formData.get('options') ?? '');
  const num = (k: string) => Number(formData.get(k));

  const caracEntries: [string, string][] = [
    ['puissance', String(formData.get('car_puissance') ?? '').trim()],
    ['cylindree', String(formData.get('car_cylindree') ?? '').trim()],
    ['consommation', String(formData.get('car_consommation') ?? '').trim()],
    ['co2', String(formData.get('car_co2') ?? '').trim()],
    ['couleur', String(formData.get('car_couleur') ?? '').trim()],
    ['carrosserie', String(formData.get('car_carrosserie') ?? '').trim()],
    ['critAir', String(formData.get('car_critair') ?? '').trim()],
    ['premiereCirculation', String(formData.get('car_premiere_circulation') ?? '').trim()],
    ['garantie', String(formData.get('car_garantie') ?? '').trim()],
  ];
  const carac: Record<string, string | number> = Object.fromEntries(
    caracEntries.filter(([, v]) => v !== '')
  );

  // portes / proprietaires sont des NOMBRES (pas des strings comme les 9
  // ci-dessus). On ne pose la clé que si une valeur numérique valide est
  // fournie — sinon clé absente (cohérent avec le strip undefined :
  // Firestore Admin SDK rejette undefined/NaN).
  const portesRaw = formData.get('car_portes');
  const portes = Number(portesRaw);
  if (portesRaw !== null && portesRaw !== '' && !Number.isNaN(portes)) {
    carac.portes = portes;
  }
  const proprietairesRaw = formData.get('car_proprietaires');
  const proprietaires = Number(proprietairesRaw);
  if (proprietairesRaw !== null && proprietairesRaw !== '' && !Number.isNaN(proprietaires)) {
    carac.proprietaires = proprietaires;
  }

  return {
    id: sanitize(formData.get('id')),
    type: String(formData.get('type') ?? ''),
    marque: sanitize(formData.get('marque')),
    modele: sanitize(formData.get('modele')),
    annee: num('annee'),
    km: num('km'),
    energie: String(formData.get('energie') ?? ''),
    transmission: sanitize(formData.get('transmission')),
    places: num('places'),
    options: optionsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    prix: num('prix'),
    mensualite: num('mensualite'),
    image: images[0] ?? '',
    images,
    description: sanitize(formData.get('description')),
    caracteristiques: carac,
    reference: sanitize(formData.get('reference')),
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
      errors: {
        _form: ['Ce véhicule a été modifié entre-temps. Rechargez la page.'],
      },
    };
  }

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'vehicule',
    resourceId: data.id,
    diff: auditDiff,
  });

  revalidateTag('vehicules');
  revalidateTag(`vehicule:${data.id}`);
  return { ok: true, message: 'Véhicule mis à jour.' };
}

export async function deleteVehicule(
  id: string,
  clientUpdatedAt: string
): Promise<FormActionState> {
  const session = await requireAdmin();

  const db = getAdminFirestore();
  // Lock optimiste (même transaction que updateVehicule) : un « Supprimer »
  // n'écrase jamais silencieusement une édition concurrente.
  let conflict = false;
  let missing = false;
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`vehicules/${id}`);
    const snap = await tx.get(ref);
    if (!snap.exists) {
      missing = true;
      return;
    }
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }
    tx.update(ref, {
      disponibilite: 'vendu',
      updatedAt: new Date().toISOString(),
    });
  });

  if (missing) {
    return { errors: { _form: ['Véhicule introuvable.'] } };
  }
  if (conflict) {
    return { errors: { _form: ['Ce véhicule a été modifié entre-temps. Rechargez la page.'] } };
  }

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
