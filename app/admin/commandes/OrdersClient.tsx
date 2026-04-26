'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

const IOS = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  red: 'var(--red)',
  orange: 'var(--orange)',
  border: 'var(--border)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textSubtle: 'rgba(28, 28, 30, 0.5)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
} as const;

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: typeof Package }
> = {
  nouvelle: { label: 'Nouvelle', color: IOS.blue, bg: 'rgba(0,122,255,0.1)', icon: Clock },
  confirmee: { label: 'Confirmée', color: IOS.blue, bg: 'rgba(0,122,255,0.08)', icon: CheckCircle },
  preparation: {
    label: 'En préparation',
    color: IOS.orange,
    bg: 'rgba(255,107,44,0.1)',
    icon: Package,
  },
  expediee: { label: 'Expédiée', color: '#FFCC00', bg: 'rgba(255,204,0,0.1)', icon: Truck },
  livree: { label: 'Livrée', color: IOS.green, bg: 'rgba(52,199,89,0.1)', icon: CheckCircle },
  annulee: { label: 'Annulée', color: IOS.red, bg: 'rgba(255,59,48,0.1)', icon: XCircle },
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  nouvelle: ['confirmee', 'annulee'],
  confirmee: ['preparation', 'annulee'],
  preparation: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

const ALL_STATUSES: OrderStatus[] = [
  'nouvelle',
  'confirmee',
  'preparation',
  'expediee',
  'livree',
  'annulee',
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function OrderRow({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const transitions = STATUS_TRANSITIONS[order.status];

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setUpdating(true);
    await onStatusChange(order.id, newStatus);
    setUpdating(false);
  };

  return (
    <div style={{ borderBottom: `1px solid ${IOS.borderFaint}` }}>
      {/* Row principale */}
      <button
        type="button"
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[rgba(242,242,247,0.8)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm font-semibold" style={{ color: IOS.text }}>
              {order.orderNumber}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm truncate" style={{ color: IOS.textMuted }}>
            {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-sm" style={{ color: IOS.text }}>
            {formatPrice(order.totalInCents)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: IOS.textSubtle }}>
            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div style={{ color: IOS.textSubtle }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Détail expandé */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4" style={{ background: 'rgba(242,242,247,0.4)' }}>
          {/* Articles */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: IOS.textSubtle }}
            >
              Articles ({order.items.length})
            </p>
            <div className="space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: IOS.textMuted }}>
                    {item.quantity}× {item.name}
                    <span className="ml-2 text-xs" style={{ color: IOS.textSubtle }}>
                      {item.reference}
                    </span>
                  </span>
                  <span className="font-medium" style={{ color: IOS.text }}>
                    {formatPrice(item.priceInCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="flex justify-between text-sm mt-2 pt-2"
              style={{ borderTop: `1px solid ${IOS.borderFaint}` }}
            >
              <span style={{ color: IOS.textMuted }}>
                Livraison (
                {order.delivery.option === 'store-pickup' ? 'retrait boutique' : 'à domicile'})
              </span>
              <span style={{ color: IOS.text }}>
                {order.delivery.priceInCents === 0
                  ? 'Gratuit'
                  : formatPrice(order.delivery.priceInCents)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold mt-1">
              <span style={{ color: IOS.text }}>Total</span>
              <span style={{ color: IOS.text }}>{formatPrice(order.totalInCents)}</span>
            </div>
          </div>

          {/* Coordonnées + livraison */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: IOS.textSubtle }}
              >
                Client
              </p>
              <p className="text-sm" style={{ color: IOS.text }}>
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-sm" style={{ color: IOS.textMuted }}>
                {order.customer.email}
              </p>
              <p className="text-sm" style={{ color: IOS.textMuted }}>
                {order.customer.phone}
              </p>
            </div>
            {order.delivery.option === 'island-delivery' && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: IOS.textSubtle }}
                >
                  Adresse
                </p>
                <p className="text-sm" style={{ color: IOS.text }}>
                  {order.delivery.address}
                </p>
                <p className="text-sm" style={{ color: IOS.textMuted }}>
                  {order.delivery.postalCode} {order.delivery.city}
                </p>
              </div>
            )}
          </div>

          {/* Actions statut */}
          {transitions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {transitions.map((next) => {
                const cfg = STATUS_CONFIG[next];
                const isDanger = next === 'annulee';
                return (
                  <button
                    key={next}
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange(next)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
                    style={{
                      background: isDanger ? 'rgba(255,59,48,0.1)' : `rgba(0,122,255,0.1)`,
                      color: isDanger ? IOS.red : IOS.blue,
                    }}
                  >
                    {updating ? '...' : `→ ${cfg.label}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'toutes'>('toutes');
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/orders?limit=50');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as Order[];
      setOrders(data);
    } catch {
      showToast({ type: 'error', message: 'Impossible de charger les commandes' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      const r = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o))
      );
      showToast({ type: 'success', message: `Statut mis à jour : ${STATUS_CONFIG[status].label}` });
    } catch {
      showToast({ type: 'error', message: 'Erreur lors de la mise à jour du statut' });
    }
  };

  const filtered = filter === 'toutes' ? orders : orders.filter((o) => o.status === filter);

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ background: IOS.bg, minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex gap-3 mb-1">
              <Link href="/admin" className="text-sm font-semibold" style={{ color: IOS.blue }}>
                ← Produits
              </Link>
            </div>
            <h1 className="font-title text-h1" style={{ color: IOS.text }}>
              Commandes
            </h1>
            <p className="text-body mt-1" style={{ color: IOS.textMuted }}>
              {orders.length} commande{orders.length !== 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 rounded-xl transition-colors hover:bg-[rgba(0,0,0,0.05)]"
            style={{ color: IOS.blue }}
            title="Actualiser"
          >
            <RefreshCw size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Filtres statut */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            type="button"
            onClick={() => setFilter('toutes')}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: filter === 'toutes' ? IOS.text : IOS.surface,
              color: filter === 'toutes' ? IOS.surface : IOS.text,
              border: `1px solid ${IOS.border}`,
            }}
          >
            Toutes {orders.length > 0 && <span>({orders.length})</span>}
          </button>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = counts[s] ?? 0;
            if (count === 0 && filter !== s) return null;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: filter === s ? cfg.color : IOS.surface,
                  color: filter === s ? '#fff' : IOS.text,
                  border: `1px solid ${filter === s ? cfg.color : IOS.border}`,
                }}
              >
                {cfg.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Liste */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: IOS.surface, border: `1px solid ${IOS.border}` }}
        >
          {loading ? (
            <div className="divide-y" style={{ borderColor: IOS.borderFaint }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="h-4 rounded w-48 mb-2" style={{ background: IOS.bg }} />
                  <div className="h-3 rounded w-64" style={{ background: IOS.bg }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Package
                size={32}
                strokeWidth={1.5}
                className="mx-auto mb-3"
                style={{ color: IOS.textSubtle }}
              />
              <p className="text-body" style={{ color: IOS.textMuted }}>
                {filter === 'toutes'
                  ? 'Aucune commande pour le moment'
                  : `Aucune commande "${STATUS_CONFIG[filter as OrderStatus]?.label}"`}
              </p>
            </div>
          ) : (
            filtered.map((order) => (
              <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
