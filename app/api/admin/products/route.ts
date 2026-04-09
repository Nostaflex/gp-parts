import { NextResponse } from 'next/server';
import { getAdapter } from '@/lib/data';

export async function GET() {
  try {
    const adapter = await getAdapter();
    const products = await adapter.getProducts();
    return NextResponse.json(products);
  } catch (err) {
    console.error('[api/admin/products] Erreur:', err);
    return NextResponse.json([], { status: 200 }); // Retourne [] plutôt que 500 pour ne pas bloquer l'UI
  }
}
