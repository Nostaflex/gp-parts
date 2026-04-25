import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limitParam = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? DEFAULT_LIMIT : limitParam), MAX_LIMIT);
    const status = searchParams.get('status') as OrderStatus | null;

    const adapter = await getAdapter();
    const orders = await adapter.getOrders({ limit, status: status ?? undefined });
    return NextResponse.json(orders);
  } catch (err) {
    console.error('[api/admin/orders] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur', data: [] }, { status: 500 });
  }
}
