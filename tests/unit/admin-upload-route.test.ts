/**
 * /api/admin/upload — server-side image upload (Admin SDK).
 *
 * Root-cause fix (2026-06-30) : l'upload client `uploadBytesResumable` exige
 * un `auth.currentUser` non-null (règle Storage `request.auth != null`). Le BO
 * est gardé par le cookie serveur `__session`, pas par l'auth client → sur
 * mobile (IndexedDB évincé) le currentUser est null → `storage/unauthorized`.
 * L'upload passe désormais par cette route, gardée par requireAdmin() (cookie),
 * et écrit via l'Admin SDK (service account, contourne les rules).
 *
 * Tests : auth-gate (401/403, pas d'écriture), validation (400), succès (200 + url).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireAdminMock, saveMock, fileMock, bucketMock, getAdminStorageMock } = vi.hoisted(() => {
  const saveMock = vi.fn(async () => undefined);
  const fileMock = vi.fn(() => ({ save: saveMock }));
  const bucketMock = vi.fn(() => ({
    name: 'car-performance971.firebasestorage.app',
    file: fileMock,
  }));
  return {
    requireAdminMock: vi.fn(),
    saveMock,
    fileMock,
    bucketMock,
    getAdminStorageMock: vi.fn(() => ({ bucket: bucketMock })),
  };
});

vi.mock('@/lib/admin/auth', async () => {
  const { AdminError: RealAdminError } =
    await vi.importActual<typeof import('@/lib/admin/auth')>('@/lib/admin/auth');
  return { requireAdmin: requireAdminMock, AdminError: RealAdminError };
});

vi.mock('@/lib/firebase-admin', () => ({ getAdminStorage: getAdminStorageMock }));

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => ({
        _body: body,
        status: (init as { status?: number } | undefined)?.status ?? 200,
      }),
    },
  };
});

import { AdminError } from '@/lib/admin/auth';

type Json = { _body: Record<string, unknown>; status: number };

/** Fake NextRequest exposing formData() — mirrors the {nextUrl} fake in admin-api-auth.test.ts. */
function reqWith(fields: Record<string, unknown>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) fd.append(k, v as string | Blob);
  }
  return { formData: async () => fd } as unknown as import('next/server').NextRequest;
}

function webp(bytes = 32) {
  return new File([new Uint8Array(bytes)], 'photo.webp', { type: 'image/webp' });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/admin/upload — auth gate', () => {
  it('401 + no write when requireAdmin throws AdminError 401', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Non authentifié', 401));
    const { POST } = await import('@/app/api/admin/upload/route');
    const res = (await POST(
      reqWith({ file: webp(), folder: 'vehicules', entityId: 'vehicule-abc', index: '1' })
    )) as unknown as Json;
    expect(res.status).toBe(401);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('403 + no write when requireAdmin throws AdminError 403', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Accès admin refusé', 403));
    const { POST } = await import('@/app/api/admin/upload/route');
    const res = (await POST(
      reqWith({ file: webp(), folder: 'vehicules', entityId: 'vehicule-abc', index: '1' })
    )) as unknown as Json;
    expect(res.status).toBe(403);
    expect(saveMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/upload — validation (authenticated)', () => {
  beforeEach(() => requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@test.com' }));

  it('400 when file is missing', async () => {
    const { POST } = await import('@/app/api/admin/upload/route');
    const res = (await POST(
      reqWith({ folder: 'vehicules', entityId: 'vehicule-abc', index: '1' })
    )) as unknown as Json;
    expect(res.status).toBe(400);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('400 when folder is not in the allowlist', async () => {
    const { POST } = await import('@/app/api/admin/upload/route');
    const res = (await POST(
      reqWith({ file: webp(), folder: 'secrets', entityId: 'x', index: '1' })
    )) as unknown as Json;
    expect(res.status).toBe(400);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('400 when entityId contains path traversal', async () => {
    const { POST } = await import('@/app/api/admin/upload/route');
    const res = (await POST(
      reqWith({ file: webp(), folder: 'vehicules', entityId: '../evil', index: '1' })
    )) as unknown as Json;
    expect(res.status).toBe(400);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('400 when content-type is not an accepted image', async () => {
    const { POST } = await import('@/app/api/admin/upload/route');
    const bad = new File([new Uint8Array(8)], 'x.svg', { type: 'image/svg+xml' });
    const res = (await POST(
      reqWith({ file: bad, folder: 'vehicules', entityId: 'vehicule-abc', index: '1' })
    )) as unknown as Json;
    expect(res.status).toBe(400);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('400 when index is out of range', async () => {
    const { POST } = await import('@/app/api/admin/upload/route');
    const res = (await POST(
      reqWith({ file: webp(), folder: 'vehicules', entityId: 'vehicule-abc', index: '99' })
    )) as unknown as Json;
    expect(res.status).toBe(400);
    expect(saveMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/upload — success (authenticated)', () => {
  beforeEach(() => requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@test.com' }));

  it('200 + writes to deterministic path + returns a firebasestorage download URL', async () => {
    const { POST } = await import('@/app/api/admin/upload/route');
    const res = (await POST(
      reqWith({ file: webp(), folder: 'vehicules', entityId: 'vehicule-abc', index: '2' })
    )) as unknown as Json;

    expect(res.status).toBe(200);
    // path déterministe vehicules/{id}/photo-{i}.webp
    expect(fileMock).toHaveBeenCalledWith('vehicules/vehicule-abc/photo-2.webp');
    expect(saveMock).toHaveBeenCalledTimes(1);

    const url = res._body.url as string;
    expect(url).toMatch(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\//);
    // chemin URL-encodé + token de download présent (URL style getDownloadURL)
    expect(url).toContain(encodeURIComponent('vehicules/vehicule-abc/photo-2.webp'));
    expect(url).toMatch(/[?&]alt=media/);
    expect(url).toMatch(/[?&]token=/);
  });

  it('save() reçoit le contentType + un download token en metadata', async () => {
    const { POST } = await import('@/app/api/admin/upload/route');
    await POST(reqWith({ file: webp(), folder: 'motos', entityId: 'moto-1', index: '1' }));

    expect(saveMock).toHaveBeenCalledTimes(1);
    const [buf, opts] = saveMock.mock.calls[0] as unknown as [Buffer, Record<string, unknown>];
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(opts.contentType).toBe('image/webp');
    const meta = opts.metadata as { metadata?: { firebaseStorageDownloadTokens?: string } };
    expect(meta.metadata?.firebaseStorageDownloadTokens).toBeTruthy();
  });
});
