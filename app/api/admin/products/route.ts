import { NextResponse } from 'next/server';
import { getAdapter } from '@/lib/data';
import { requireAdmin, AdminError } from '@/lib/admin/auth';

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  try {
    const adapter = await getAdapter();
    const products = await adapter.getProducts();
    return NextResponse.json(products);
  } catch (err) {
    console.error('[api/admin/products] Erreur:', err);
    return NextResponse.json([], { status: 200 }); // Retourne [] plutôt que 500 pour ne pas bloquer l'UI
  }
}
