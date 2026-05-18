'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { MotoSchema } from '@/lib/schemas/moto';
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
    ['poids', String(formData.get('car_poids') ?? '').trim()],
    ['couleur', String(formData.get('car_couleur') ?? '').trim()],
    ['permis', String(formData.get('car_permis') ?? '').trim()],
    ['premiereCirculation', String(formData.get('car_premiere_circulation') ?? '').trim()],
    ['garantie', String(formData.get('car_garantie') ?? '').trim()],
  ];
  const carac: Record<string, string | number> = Object.fromEntries(
    caracEntries.filter(([, v]) => v !== '')
  );

  // proprietaires est un NOMBRE (pas une string comme les 8 ci-dessus).
  // On ne pose la clé que si une valeur numérique valide est fournie —
  // sinon clé absente (cohérent avec le strip undefined : Firestore Admin
  // SDK rejette undefined/NaN).
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
    categorie: sanitize(formData.get('categorie')),
    energie: String(formData.get('energie') ?? ''),
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

export async function createMoto(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = MotoSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const db = getAdminFirestore();
  await db.doc(`motos/${data.id}`).set(data);

  await writeAuditLog({
    actor: session.email,
    action: 'create',
    resourceType: 'moto',
    resourceId: data.id,
  });

  revalidateTag('motos');
  revalidateTag(`moto:${data.id}`);
  redirect('/admin/motos');
}

export async function updateMoto(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const session = await requireAdmin();

  const parsed = MotoSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const clientUpdatedAt = String(formData.get('updatedAt') ?? '');

  const db = getAdminFirestore();
  const ref = db.doc(`motos/${data.id}`);

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
        _form: ['Cette moto a été modifiée entre-temps. Rechargez la page.'],
      },
    };
  }

  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'moto',
    resourceId: data.id,
    diff: auditDiff,
  });

  revalidateTag('motos');
  revalidateTag(`moto:${data.id}`);
  return { ok: true, message: 'Moto mise à jour.' };
}

export async function deleteMoto(id: string): Promise<FormActionState> {
  const session = await requireAdmin();

  const db = getAdminFirestore();
  await db.doc(`motos/${id}`).update({
    disponibilite: 'vendu',
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actor: session.email,
    action: 'delete',
    resourceType: 'moto',
    resourceId: id,
  });

  revalidateTag('motos');
  revalidateTag(`moto:${id}`);
  return { ok: true, message: 'Moto marquée comme vendue.' };
}
