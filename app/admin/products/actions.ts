'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { writeAuditLog } from '@/lib/admin/audit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { ProductWriteSchema } from '@/lib/schemas/product';
import { computeDiff } from '@/lib/admin/diff';
import { slugify } from '@/lib/utils';

import type { FormActionState } from '@/components/admin/FormShell';
import type { AuditAction } from '@/lib/admin/audit';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retire les control characters non-printables (identique commande/actions.ts). */
function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * parseForm : lit UNIQUEMENT les champs de baseShape.
 * Ne lit JAMAIS id / slug / createdAt / updatedAt / deletedAt depuis formData.
 *
 * Prix : reçu en euros (string), converti en centimes entiers.
 * Compatibility : loop dense bornée à COMPAT_MAX (50) — s'arrête au premier trou,
 * ignore tout index hors [0..49].
 */
type ParseFormError = { _parseError: string };
type ParseFormOk = Record<string, unknown>;

function isParseError(result: ParseFormOk | ParseFormError): result is ParseFormError {
  return '_parseError' in result;
}

function parseForm(formData: FormData): ParseFormOk | ParseFormError {
  // ── prix ───────────────────────────────────────────────────────────────────
  const priceEuros = Number(formData.get('price'));
  if (!Number.isFinite(priceEuros)) {
    return { _parseError: 'Prix invalide.' };
  }
  const price = Math.round(priceEuros * 100);
  if (!Number.isInteger(price) || price < 0) {
    return { _parseError: 'Prix invalide (négatif ou non-entier).' };
  }

  const priceOriginalRaw = formData.get('priceOriginal');
  let priceOriginal: number | undefined;
  if (priceOriginalRaw !== null && String(priceOriginalRaw).trim() !== '') {
    const priceOriginalEuros = Number(priceOriginalRaw);
    if (!Number.isFinite(priceOriginalEuros)) {
      return { _parseError: 'Prix original invalide.' };
    }
    const cents = Math.round(priceOriginalEuros * 100);
    if (!Number.isInteger(cents) || cents < 0) {
      return { _parseError: 'Prix original invalide (négatif ou non-entier).' };
    }
    priceOriginal = cents;
  }

  // ── stock ──────────────────────────────────────────────────────────────────
  const stock = Number(formData.get('stock'));

  // ── images ─────────────────────────────────────────────────────────────────
  const images = formData.getAll('images').map(String).filter(Boolean);

  // ── isPromoted ─────────────────────────────────────────────────────────────
  const isPromotedRaw = formData.get('isPromoted');
  const isPromoted =
    isPromotedRaw === 'true' || isPromotedRaw === '1' || isPromotedRaw === 'on';

  // ── compatibility — dense bounded loop ────────────────────────────────────
  // Itère de 0 à 49 et s'arrête au premier trou (brand vide).
  // Un formData avec compat_99999_brand est totalement ignoré.
  const compatibility: Array<{
    brand: string;
    model: string;
    yearFrom: number;
    yearTo?: number;
  }> = [];
  for (let i = 0; i < 50; i++) {
    const brand = sanitize(formData.get(`compat_${i}_brand`));
    if (!brand) break; // dense: stop au premier trou, ignore indices supérieurs
    const model = sanitize(formData.get(`compat_${i}_model`));
    const yearFrom = Number(formData.get(`compat_${i}_yearFrom`));
    const yearToRaw = formData.get(`compat_${i}_yearTo`);
    compatibility.push({
      brand,
      model,
      yearFrom,
      ...(yearToRaw ? { yearTo: Number(yearToRaw) } : {}),
    });
  }

  // ── scalaires texte ────────────────────────────────────────────────────────
  const parsed: Record<string, unknown> = {
    name: sanitize(formData.get('name')),
    reference: sanitize(formData.get('reference')),
    description: sanitize(formData.get('description')),
    shortDescription: sanitize(formData.get('shortDescription')),
    price,
    images,
    category: sanitize(formData.get('category')),
    vehicleType: sanitize(formData.get('vehicleType')),
    compatibility,
    stock,
    isPromoted,
  };

  // priceOriginal : ne poser la clé que si définie (strip undefined pour Firestore)
  if (priceOriginal !== undefined) {
    parsed.priceOriginal = priceOriginal;
  }

  return parsed;
}

/** Best-effort denied audit — émis AVANT rethrow, ne masque pas l'erreur originale.
 *
 * API CONSTRAINT: AuditAction = 'create' | 'update' | 'delete' — 'denied' absent.
 * Workaround : on utilise l'action correspondante à la mutation tentée, avec
 * resourceId = 'denied:<id|new>' pour distinguer les refus en audit.
 * Limitation reportée dans le commit.
 */
async function emitDeniedAudit(
  action: AuditAction,
  resourceId: string
): Promise<void> {
  await writeAuditLog({
    actor: 'unauthorized',
    action,
    resourceType: 'product',
    resourceId: `denied:${resourceId}`,
  }).catch((err) => {
    process.stderr.write(`[audit] denied log failed: ${String(err)}\n`);
  });
}

/** Invalide les caches côté Next.js après une mutation. */
function revalidateProducts(slug?: string): void {
  revalidateTag('products');
  if (slug) {
    revalidatePath(`/pieces/${slug}`);
  }
  revalidatePath('/sitemap.xml');
}

// ─── createProduct ───────────────────────────────────────────────────────────

export async function createProduct(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  // requireAdmin FIRST
  let session: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    session = await requireAdmin();
  } catch (e) {
    await emitDeniedAudit('create', 'new');
    throw e;
  }

  const rawParsed = parseForm(formData);
  if (isParseError(rawParsed)) {
    return { errors: { _form: [rawParsed._parseError] } };
  }

  const validation = ProductWriteSchema.safeParse(rawParsed);
  if (!validation.success) {
    return { errors: validation.error.flatten().fieldErrors };
  }

  const data = validation.data;
  const now = new Date().toISOString();
  // slug dérivé server-side du name
  const slug = slugify(data.name);

  const db = getAdminFirestore();

  // Unicité slug dans la transaction
  let slugConflict = false;
  await db.runTransaction(async (tx) => {
    // Vérifier unicité slug
    const existing = await db.collection('products').where('slug', '==', slug).limit(1).get();
    if (!existing.empty) {
      slugConflict = true;
      return;
    }
    const docRef = db.collection('products').doc();
    tx.set(docRef, {
      ...data,
      id: docRef.id,
      slug,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  });

  if (slugConflict) {
    return { errors: { _form: ['Slug déjà utilisé. Modifiez le nom du produit.'] } };
  }

  // writeAuditLog POST-commit
  await writeAuditLog({
    actor: session.email,
    action: 'create',
    resourceType: 'product',
    resourceId: slug,
  });

  revalidateProducts(slug);
  redirect('/admin/products');
}

// ─── updateProduct ───────────────────────────────────────────────────────────

export async function updateProduct(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  // requireAdmin FIRST
  let session: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    session = await requireAdmin();
  } catch (e) {
    await emitDeniedAudit('update', sanitize(formData.get('id')) || 'unknown');
    throw e;
  }

  const productId = sanitize(formData.get('id'));
  if (!productId) {
    return { errors: { _form: ['Identifiant produit manquant.'] } };
  }

  // clientUpdatedAt pour l'optimistic lock (champ hidden du form, PAS parseForm)
  const clientUpdatedAt = sanitize(formData.get('clientUpdatedAt'));

  const rawParsed = parseForm(formData);
  if (isParseError(rawParsed)) {
    return { errors: { _form: [rawParsed._parseError] } };
  }

  const validation = ProductWriteSchema.safeParse(rawParsed);
  if (!validation.success) {
    return { errors: validation.error.flatten().fieldErrors };
  }

  const data = validation.data;
  const now = new Date().toISOString();
  const db = getAdminFirestore();
  const ref = db.collection('products').doc(productId);

  let conflict = false;
  let slugConflict = false;
  let auditDiff: Record<string, { before: unknown; after: unknown }> = {};
  let productSlug = '';

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;

    // Optimistic lock
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }

    // Slug: conserver le slug existant (ne pas le re-dériver au update pour éviter
    // de casser les URLs existantes). Si le nom change et on veut re-slugifier,
    // c'est une décision explicite — ici on préserve.
    const slug = (before.slug as string) || slugify(data.name);
    productSlug = slug;

    // Unicité slug : si le slug change, vérifier l'absence de collision
    if (slug !== before.slug) {
      const existing = await db
        .collection('products')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      if (!existing.empty) {
        slugConflict = true;
        return;
      }
    }

    const updatePayload: Record<string, unknown> = {
      ...data,
      slug,
      updatedAt: now,
    };

    // Strip undefined (Firestore Admin SDK rejette undefined)
    for (const key of Object.keys(updatePayload)) {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    }

    auditDiff = computeDiff(before, updatePayload);
    tx.update(ref, updatePayload);
  });

  if (conflict) {
    return { errors: { _form: ['Ce produit a été modifié entre-temps. Rechargez la page.'] } };
  }
  if (slugConflict) {
    return { errors: { _form: ['Slug déjà utilisé. Modifiez le nom du produit.'] } };
  }

  // writeAuditLog POST-commit
  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'product',
    resourceId: productId,
    diff: auditDiff,
  });

  revalidateProducts(productSlug);
  return { ok: true, message: 'Produit mis à jour.' };
}

// ─── deleteProduct (soft-delete avec optimistic lock) ────────────────────────

export async function deleteProduct(
  productId: string,
  clientUpdatedAt: string
): Promise<FormActionState> {
  // requireAdmin FIRST
  let session: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    session = await requireAdmin();
  } catch (e) {
    await emitDeniedAudit('delete', productId);
    throw e;
  }

  const db = getAdminFirestore();
  const ref = db.collection('products').doc(productId);
  const now = new Date().toISOString();

  let conflict = false;
  let productSlug = '';

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;

    // Optimistic lock (même transaction que updateProduct)
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }

    productSlug = (before.slug as string) || productId;

    tx.update(ref, {
      deletedAt: now,
      updatedAt: now,
    });
  });

  if (conflict) {
    return {
      errors: { _form: ['Ce produit a été modifié entre-temps. Rechargez la page.'] },
    };
  }

  // writeAuditLog POST-commit
  await writeAuditLog({
    actor: session.email,
    action: 'delete',
    resourceType: 'product',
    resourceId: productId,
  });

  revalidateProducts(productSlug);
  return { ok: true, message: 'Produit supprimé (soft-delete).' };
}

// ─── restoreProduct ───────────────────────────────────────────────────────────

export async function restoreProduct(
  productId: string,
  clientUpdatedAt: string
): Promise<FormActionState> {
  // requireAdmin FIRST
  let session: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    session = await requireAdmin();
  } catch (e) {
    await emitDeniedAudit('update', `restore:${productId}`);
    throw e;
  }

  const db = getAdminFirestore();
  const ref = db.collection('products').doc(productId);
  const now = new Date().toISOString();

  let conflict = false;
  let productSlug = '';

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = (snap.data?.() ?? {}) as Record<string, unknown>;

    // Optimistic lock
    if (before.updatedAt && before.updatedAt !== clientUpdatedAt) {
      conflict = true;
      return;
    }

    productSlug = (before.slug as string) || productId;

    tx.update(ref, {
      deletedAt: null,
      updatedAt: now,
    });
  });

  if (conflict) {
    return {
      errors: { _form: ['Ce produit a été modifié entre-temps. Rechargez la page.'] },
    };
  }

  // writeAuditLog POST-commit.
  // API CONSTRAINT: AuditAction n'inclut pas 'restore' → on utilise 'update'
  // avec diff pour tracer le changement deletedAt!=null → null.
  // Reporté dans le commit.
  await writeAuditLog({
    actor: session.email,
    action: 'update',
    resourceType: 'product',
    resourceId: productId,
    diff: { deletedAt: { before: 'non-null', after: null } },
  });

  revalidateProducts(productSlug);
  return { ok: true, message: 'Produit restauré.' };
}
