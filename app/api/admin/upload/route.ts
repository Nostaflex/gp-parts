import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { requireAdmin, AdminError } from '@/lib/admin/auth';
import { getAdminStorage } from '@/lib/firebase-admin';

/**
 * Upload photo catalogue côté serveur (Admin SDK).
 *
 * Pourquoi serveur et pas client : l'upload SDK client (`uploadBytesResumable`)
 * exige `auth.currentUser` non-null car la règle Storage impose
 * `request.auth != null`. Le BO est gardé par le cookie serveur `__session`,
 * pas par l'auth client Firebase → sur mobile (IndexedDB évincé par Safari iOS)
 * `currentUser` est null alors que le cookie est valide → `storage/unauthorized`
 * → "échec upload". Ici l'auth vient du cookie (requireAdmin) et l'écriture du
 * service account (contourne les rules). Même posture que demandes-server.ts.
 *
 * Flux : le client compresse l'image (WebP ≤2000px) AVANT de POSTer le blob.
 * Réponse : { url } — URL de download style getDownloadURL (token), donc host
 * `firebasestorage.googleapis.com` (déjà en remotePatterns + CSP img-src).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOLDERS = ['vehicules', 'motos', 'products', 'location'] as const;
type Folder = (typeof FOLDERS)[number];

// MIME accepté → extension du fichier stocké. Le client compresse en WebP ; on
// garde jpeg/png par robustesse (compression peut être contournée).
const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

// 8 Mo (audit 2026-08-18 — le client compresse en WebP ≲ 2 Mo ; 25 Mo
// laissait passer des images pathologiques).
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_INDEX = 8; // borne large (forms : max 5/8) — anti-path-flood
const ENTITY_ID_RE = /^[a-zA-Z0-9_-]+$/; // anti path-traversal (pas de / ni ..)

/** Signatures binaires des trois formats acceptés. */
function magicBytesMatch(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  switch (mime) {
    case 'image/jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return buf
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return (
        buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buf.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    default:
      return false;
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  // 1) Auth via cookie __session (cryptographique + whitelist meta/admins)
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // 2) Lecture + validation stricte du multipart
  const form = await request.formData();
  const file = form.get('file');
  const folder = String(form.get('folder') ?? '');
  const entityId = String(form.get('entityId') ?? '');
  const index = Number(form.get('index') ?? 0);

  if (!(file instanceof File)) return bad('fichier manquant');
  if (!FOLDERS.includes(folder as Folder)) return bad('dossier invalide');
  if (!ENTITY_ID_RE.test(entityId)) return bad('identifiant invalide');
  if (!Number.isInteger(index) || index < 1 || index > MAX_INDEX) return bad('index invalide');
  const ext = EXT[file.type];
  if (!ext) return bad('format non supporté');
  if (file.size === 0) return bad('fichier vide');
  if (file.size > MAX_BYTES) return bad('fichier trop volumineux');

  // 3) Le MIME déclaré ne suffit pas (audit 2026-08-18) : vérification des
  // MAGIC BYTES réels — un polyglotte déguisé en image est refusé.
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!magicBytesMatch(buffer, file.type))
    return bad('contenu ne correspond pas au format déclaré');

  // 4) Écriture Admin SDK — chemin déterministe (pas d'orphelins) + token download
  const path = `${folder}/${entityId}/photo-${index}.${ext}`;
  const token = randomUUID();

  const bucket = getAdminStorage().bucket();
  try {
    await bucket.file(path).save(buffer, {
      resumable: false,
      contentType: file.type,
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
  } catch (err) {
    console.error('[api/admin/upload] save error:', err);
    return NextResponse.json({ error: 'écriture stockage échouée' }, { status: 502 });
  }

  // URL style getDownloadURL : le token donne l'accès lecture (host = firebasestorage)
  const url =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodeURIComponent(path)}?alt=media&token=${token}`;

  return NextResponse.json({ url });
}
