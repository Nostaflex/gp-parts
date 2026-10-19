import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { ORDER_TRANSITIONS, updateOrderStatusAdmin } from '@/lib/admin/orders-server';
import type { OrderStatus } from '@/lib/types';
import { requireAdmin, AdminError } from '@/lib/admin/auth';

// Les transitions sont validées côté serveur, dans la transaction
// (updateOrderStatusAdmin) : un PATCH direct ne contourne pas l'UI admin.

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  try {
    const { status: newStatus } = (await request.json()) as { status: OrderStatus };

    if (!newStatus || !(newStatus in ORDER_TRANSITIONS)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const result = await updateOrderStatusAdmin(params.id, newStatus);
    if (!result.ok && result.reason === 'introuvable') {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: `Transition interdite : ${result.current} → ${newStatus}` },
        { status: 422 }
      );
    }
    // Annulation : le stock revient, cache des pièces rafraîchi (analyse BO du 18/10, F5).
    if (newStatus === 'annulee') revalidateTag('products');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/orders/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
