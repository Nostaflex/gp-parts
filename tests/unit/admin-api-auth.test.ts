/**
 * Vuln 2 — Admin API route authentication guard tests.
 *
 * Verifies that each of the 3 admin route handlers:
 *   - Returns 401 when requireAdmin() throws AdminError(401)
 *   - Does NOT call the data adapter on auth failure
 *   - Returns normal success response when requireAdmin() resolves
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks (must be top of file, before imports) ─────────────
const {
  requireAdminMock,
  getProductsMock,
  getOrdersMock,
  getOrderByIdMock,
  updateOrderStatusMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getProductsMock: vi.fn(),
  getOrdersMock: vi.fn(),
  getOrderByIdMock: vi.fn(),
  updateOrderStatusMock: vi.fn(),
}));

vi.mock('@/lib/admin/auth', async () => {
  const { AdminError: RealAdminError } =
    await vi.importActual<typeof import('@/lib/admin/auth')>('@/lib/admin/auth');
  return {
    requireAdmin: requireAdminMock,
    AdminError: RealAdminError,
  };
});

vi.mock('@/lib/data', () => ({
  getAdapter: vi.fn(async () => ({
    getProducts: getProductsMock,
    getOrders: getOrdersMock,
    getOrderById: getOrderByIdMock,
    updateOrderStatus: updateOrderStatusMock,
  })),
}));

// Keep NextResponse.json working but capture responses for assertions.
// next/server works in vitest with happy-dom, but we need it to return
// a plain object so we can inspect .status without a real Response.
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

// ─── Tests: /api/admin/products GET ───────────────────────────────────
describe('GET /api/admin/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProductsMock.mockResolvedValue([{ id: '1', name: 'Test' }]);
  });

  it('returns 401 and does NOT call adapter when requireAdmin throws AdminError 401', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Non authentifié', 401));

    const { GET } = await import('@/app/api/admin/products/route');
    const res = await GET();

    expect((res as { status: number }).status).toBe(401);
    expect(getProductsMock).not.toHaveBeenCalled();
  });

  it('returns 403 and does NOT call adapter when requireAdmin throws AdminError 403', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Accès admin refusé', 403));

    const { GET } = await import('@/app/api/admin/products/route');
    const res = await GET();

    expect((res as { status: number }).status).toBe(403);
    expect(getProductsMock).not.toHaveBeenCalled();
  });

  it('returns products when requireAdmin resolves', async () => {
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@test.com' });

    const { GET } = await import('@/app/api/admin/products/route');
    const res = await GET();

    expect(getProductsMock).toHaveBeenCalled();
    expect((res as { status: number }).status).toBe(200);
  });

  it('re-throws non-AdminError from requireAdmin', async () => {
    requireAdminMock.mockRejectedValue(new Error('Firebase down'));

    const { GET } = await import('@/app/api/admin/products/route');
    await expect(GET()).rejects.toThrow('Firebase down');
  });
});

// ─── Tests: /api/admin/orders GET ─────────────────────────────────────
describe('GET /api/admin/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrdersMock.mockResolvedValue([]);
  });

  it('returns 401 and does NOT call adapter when requireAdmin throws AdminError 401', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Non authentifié', 401));

    const { GET } = await import('@/app/api/admin/orders/route');
    const req = new Request(
      'http://localhost/api/admin/orders'
    ) as unknown as import('next/server').NextRequest;
    const res = await GET(req);

    expect((res as { status: number }).status).toBe(401);
    expect(getOrdersMock).not.toHaveBeenCalled();
  });

  it('returns 403 when requireAdmin throws AdminError 403', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Accès admin refusé', 403));

    const { GET } = await import('@/app/api/admin/orders/route');
    const req = new Request(
      'http://localhost/api/admin/orders'
    ) as unknown as import('next/server').NextRequest;
    const res = await GET(req);

    expect((res as { status: number }).status).toBe(403);
    expect(getOrdersMock).not.toHaveBeenCalled();
  });

  it('returns orders when requireAdmin resolves', async () => {
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@test.com' });
    getOrdersMock.mockResolvedValue([{ id: 'o1' }]);

    const { GET } = await import('@/app/api/admin/orders/route');
    // Provide a NextRequest-shaped object with nextUrl.searchParams
    const url = new URL('http://localhost/api/admin/orders?limit=10');
    const req = {
      nextUrl: url,
    } as unknown as import('next/server').NextRequest;
    const res = await GET(req);

    expect(getOrdersMock).toHaveBeenCalled();
    expect((res as { status: number }).status).toBe(200);
  });
});

// ─── Tests: /api/admin/orders/[id] PATCH ──────────────────────────────
describe('PATCH /api/admin/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrderByIdMock.mockResolvedValue({ id: 'o1', status: 'nouvelle' });
    updateOrderStatusMock.mockResolvedValue(undefined);
  });

  it('returns 401 and does NOT call adapter when requireAdmin throws AdminError 401', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Non authentifié', 401));

    const { PATCH } = await import('@/app/api/admin/orders/[id]/route');
    const req = new Request('http://localhost/api/admin/orders/o1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmee' }),
      headers: { 'content-type': 'application/json' },
    }) as unknown as import('next/server').NextRequest;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'o1' }) });
    expect((res as { status: number }).status).toBe(401);
    expect(getOrderByIdMock).not.toHaveBeenCalled();
    expect(updateOrderStatusMock).not.toHaveBeenCalled();
  });

  it('returns 403 when requireAdmin throws AdminError 403', async () => {
    requireAdminMock.mockRejectedValue(new AdminError('Accès admin refusé', 403));

    const { PATCH } = await import('@/app/api/admin/orders/[id]/route');
    const req = new Request('http://localhost/api/admin/orders/o1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmee' }),
      headers: { 'content-type': 'application/json' },
    }) as unknown as import('next/server').NextRequest;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'o1' }) });
    expect((res as { status: number }).status).toBe(403);
    expect(updateOrderStatusMock).not.toHaveBeenCalled();
  });

  it('updates order status when admin is authenticated and transition is valid', async () => {
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@test.com' });

    const { PATCH } = await import('@/app/api/admin/orders/[id]/route');
    const req = new Request('http://localhost/api/admin/orders/o1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmee' }),
      headers: { 'content-type': 'application/json' },
    }) as unknown as import('next/server').NextRequest;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'o1' }) });

    expect(updateOrderStatusMock).toHaveBeenCalledWith('o1', 'confirmee');
    expect((res as { status: number }).status).toBe(200);
  });

  it('returns 422 for invalid transition even when authenticated', async () => {
    requireAdminMock.mockResolvedValue({ uid: 'u1', email: 'admin@test.com' });
    // order is already 'livree' — no transitions allowed
    getOrderByIdMock.mockResolvedValue({ id: 'o1', status: 'livree' });

    const { PATCH } = await import('@/app/api/admin/orders/[id]/route');
    const req = new Request('http://localhost/api/admin/orders/o1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'annulee' }),
      headers: { 'content-type': 'application/json' },
    }) as unknown as import('next/server').NextRequest;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'o1' }) });
    expect((res as { status: number }).status).toBe(422);
    expect(updateOrderStatusMock).not.toHaveBeenCalled();
  });
});
