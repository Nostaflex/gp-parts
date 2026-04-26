import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/data';
import type { OrderStatus } from '@/lib/types';

// Transitions autorisées — miroir de STATUS_TRANSITIONS côté client
// Valider ici empêche un PATCH direct qui bypasse l'UI admin
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['preparation', 'annulee'],
  preparation: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status: newStatus } = (await request.json()) as { status: OrderStatus };

    if (!newStatus || !(newStatus in ALLOWED_TRANSITIONS)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const adapter = await getAdapter();
    const order = await adapter.getOrderById(params.id);

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Transition interdite : ${order.status} → ${newStatus}` },
        { status: 422 }
      );
    }

    await adapter.updateOrderStatus(params.id, newStatus);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/orders/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
