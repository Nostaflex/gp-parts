'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { MotoSchema } from '@/lib/schemas/moto';
import { computePatchDiff } from '@/lib/admin/diff';
import { PARSE_FR } from '@/lib/admin/form-errors';

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

  const parsed = MotoSchema.safeParse(parseForm(formData), PARSE_FR);
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

  const parsed = MotoSchema.safeParse(parseForm(formData), PARSE_FR);
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
    auditDiff = computePatchDiff(before, data as Record<string, unknown>);
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

/**
 * Écrit `patch` sous lock optimiste (même transaction que updateMoto) :
 * « Vendu », « Supprimer » et « Restaurer » n'écrasent jamais silencieusement
 * une édition concurrente. Retourne les erreurs à afficher, ou le nouvel
 * horodatage du document.
 */
async function patchMoto(
  id: string,
  clientUpdatedAt: string,
  patch: Record<string, unknown>
): Promise<{ errors: Record<string, string[]> } | { updatedAt: string }> {
  const db = getAdminFirestore();
  const updatedAt = new Date().toISOString();
  let conflict = false;
  let missing = false;
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`motos/${id}`);
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
    tx.update(ref, { ...patch, updatedAt });
  });

  if (missing) {
    return { errors: { _form: ['Moto introuvable.'] } };
  }
  if (conflict) {
    return { errors: { _form: ['Cette moto a été modifiée entre-temps. Rechargez la page.'] } };
  }
  return { updatedAt };
}

/** Patch + audit + revalidation : le tronc commun des trois actions de ligne. */
async function ligneMoto(
  id: string,
  clientUpdatedAt: string,
  patch: Record<string, unknown>,
  action: 'update' | 'delete' | 'restore',
  message: string
): Promise<FormActionState> {
  const session = await requireAdmin();

  const res = await patchMoto(id, clientUpdatedAt, patch);
  if ('errors' in res) return res;

  await writeAuditLog({ actor: session.email, action, resourceType: 'moto', resourceId: id });

  revalidateTag('motos');
  revalidateTag(`moto:${id}`);
  return { ok: true, message, updatedAt: res.updatedAt };
}

/** « Vendu » : l'annonce reste affichée sur le site public, en fin de grille. */
export async function markMotoVendu(id: string, clientUpdatedAt: string): Promise<FormActionState> {
  return ligneMoto(
    id,
    clientUpdatedAt,
    { disponibilite: 'vendu' },
    'update',
    'Moto marquée comme vendue.'
  );
}

/**
 * « Supprimer » : part à la corbeille (soft-delete `deletedAt`). L'annonce
 * disparaît du site (filtre dans FirebaseAdapter.getMotos) et se retrouve
 * dans l'onglet Corbeille du BO.
 */
export async function deleteMoto(id: string, clientUpdatedAt: string): Promise<FormActionState> {
  const deletedAt = new Date().toISOString();
  return ligneMoto(id, clientUpdatedAt, { deletedAt }, 'delete', 'Moto supprimée.');
}

/** « Restaurer » : sort de la corbeille, dans l'état qu'elle avait (disponibilité intacte). */
export async function restoreMoto(id: string, clientUpdatedAt: string): Promise<FormActionState> {
  return ligneMoto(id, clientUpdatedAt, { deletedAt: null }, 'restore', 'Moto restaurée.');
}
