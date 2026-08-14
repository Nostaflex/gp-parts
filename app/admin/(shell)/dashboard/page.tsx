import Link from 'next/link';
import {
  AlertTriangle,
  Bike,
  CalendarCheck,
  Car,
  ClipboardList,
  Droplets,
  Euro,
  MessageSquare,
  Package,
  Share2,
  ShoppingCart,
  Star,
} from 'lucide-react';

import { requireAdminPage } from '@/lib/admin/auth';
import { getDashboardData } from '@/lib/admin/dashboard-server';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tableau de bord — Admin GP Parts',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const IOS = {
  text: 'var(--text)',
  blue: 'var(--blue)',
  surface: 'var(--surface)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textSubtle: 'rgba(28, 28, 30, 0.5)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
  warning: '#FF9500',
} as const;

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  nouvelle: { label: 'Nouvelle', tone: 'info' },
  confirmee: { label: 'Confirmée', tone: 'info' },
  preparation: { label: 'En préparation', tone: 'warning' },
  expediee: { label: 'Expédiée', tone: 'warning' },
  livree: { label: 'Livrée', tone: 'success' },
  annulee: { label: 'Annulée', tone: 'danger' },
};

function formatDateGuadeloupe(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guadeloupe',
  }).format(new Date(iso));
}

/** Tuile « à traiter » : compteur cliquable vers la section. Count 0 = estompée. */
function ActionTile({
  href,
  label,
  count,
  icon: Icon,
}: {
  href: string;
  label: string;
  count: number;
  icon: LucideIcon;
}) {
  const active = count > 0;
  return (
    <Link
      href={href}
      className="rounded-2xl p-4 shadow-subtle flex items-center gap-3 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2"
      style={{
        background: active ? 'rgba(0, 122, 255, 0.08)' : IOS.surface,
        border: `1px solid ${active ? 'rgba(0, 122, 255, 0.3)' : IOS.borderFaint}`,
        opacity: active ? 1 : 0.65,
      }}
    >
      <Icon
        size={20}
        strokeWidth={1.75}
        style={{ color: active ? IOS.blue : IOS.textSubtle }}
        aria-hidden
      />
      <div className="min-w-0">
        <p
          className="font-title text-h3 leading-none"
          style={{ color: active ? IOS.blue : IOS.text }}
        >
          {count}
        </p>
        <p className="text-caption truncate" style={{ color: IOS.textMuted }}>
          {label}
        </p>
      </div>
    </Link>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 shadow-subtle"
      style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}` }}
    >
      <Icon size={22} strokeWidth={1.75} className="mb-3" style={{ color: accent }} aria-hidden />
      <p className="font-title text-h2 mb-1" style={{ color: IOS.text }}>
        {value}
      </p>
      <p className="text-caption" style={{ color: IOS.textMuted }}>
        {label}
      </p>
    </div>
  );
}

/** Mini-carte pôle : porte d'entrée d'une activité, compteur optionnel. */
function PoleCard({
  href,
  label,
  detail,
  icon: Icon,
}: {
  href: string;
  label: string;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl p-4 shadow-subtle flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2"
      style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}` }}
    >
      <Icon size={20} strokeWidth={1.75} style={{ color: IOS.textMuted }} aria-hidden />
      <div className="min-w-0">
        <p className="font-medium text-body-sm truncate" style={{ color: IOS.text }}>
          {label}
        </p>
        {detail && (
          <p className="text-caption" style={{ color: IOS.textMuted }}>
            {detail}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const { badges, orders, stock, catalogue, recentOrders } = await getDashboardData();

  const aTraiter = badges.commandes + badges.reservations + badges.demandes + badges.avis;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <p className="text-overline uppercase mb-1" style={{ color: IOS.textSubtle }}>
          Back office
        </p>
        <h1 className="font-title text-h1" style={{ color: IOS.text }}>
          Tableau de bord
        </h1>
        <p className="text-body mt-2" style={{ color: IOS.textMuted }}>
          {aTraiter > 0
            ? `${aTraiter} élément${aTraiter > 1 ? 's' : ''} en attente de traitement.`
            : 'Tout est traité — rien en attente.'}
        </p>
      </div>

      {/* Étage 1 — À traiter */}
      <section aria-label="À traiter">
        <h2 className="text-overline uppercase mb-3" style={{ color: IOS.textSubtle }}>
          À traiter
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionTile
            href="/admin/commandes"
            label="Commandes ouvertes"
            count={badges.commandes}
            icon={ShoppingCart}
          />
          <ActionTile href="/admin/avis" label="Avis à modérer" count={badges.avis} icon={Star} />
          <ActionTile
            href="/admin/reservations"
            label="Réservations ouvertes"
            count={badges.reservations}
            icon={CalendarCheck}
          />
          <ActionTile
            href="/admin/demandes"
            label="Demandes ouvertes"
            count={badges.demandes}
            icon={MessageSquare}
          />
        </div>
      </section>

      {/* Étage 2 — Santé business */}
      <section aria-label="Chiffres du mois">
        <h2 className="text-overline uppercase mb-3" style={{ color: IOS.textSubtle }}>
          Ce mois-ci
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="CA du mois (payé)"
            value={formatPrice(orders.caMoisInCents)}
            icon={Euro}
            accent={IOS.text}
          />
          <KpiCard
            label="Commandes aujourd'hui"
            value={orders.commandesJour}
            icon={ClipboardList}
            accent={IOS.blue}
          />
          <KpiCard
            label="Stock faible / ruptures"
            value={`${stock.lowStock} / ${stock.outOfStock}`}
            icon={AlertTriangle}
            accent={IOS.warning}
          />
          <KpiCard
            label="Valeur du stock pièces"
            value={formatPrice(stock.stockValueInCents)}
            icon={Package}
            accent={IOS.text}
          />
        </div>
      </section>

      {/* Étage 3 — Pôles */}
      <section aria-label="Catalogue et activités">
        <h2 className="text-overline uppercase mb-3" style={{ color: IOS.textSubtle }}>
          Catalogue &amp; activités
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <PoleCard
            href="/admin/products"
            label="Pièces"
            detail={`${stock.total} active${stock.total > 1 ? 's' : ''}`}
            icon={Package}
          />
          <PoleCard
            href="/admin/vehicules"
            label="Véhicules"
            detail={`${catalogue.vehiculesDispo} disponible${catalogue.vehiculesDispo > 1 ? 's' : ''}`}
            icon={Car}
          />
          <PoleCard
            href="/admin/motos"
            label="Motos"
            detail={`${catalogue.motosDispo} disponible${catalogue.motosDispo > 1 ? 's' : ''}`}
            icon={Bike}
          />
          <PoleCard href="/admin/location" label="Location" icon={Car} />
          <PoleCard href="/admin/lavage" label="Lavage" icon={Droplets} />
          <PoleCard href="/admin/posts-sociaux" label="Posts sociaux" icon={Share2} />
        </div>
      </section>

      {/* Étage 4 — 5 dernières commandes */}
      <section aria-label="Dernières commandes">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-overline uppercase" style={{ color: IOS.textSubtle }}>
            Dernières commandes
          </h2>
          <Link
            href="/admin/commandes"
            className="text-body-sm font-medium"
            style={{ color: IOS.blue }}
          >
            Tout voir
          </Link>
        </div>
        <div
          className="rounded-2xl shadow-subtle overflow-hidden"
          style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}` }}
        >
          {recentOrders.length === 0 ? (
            <p className="py-10 text-center text-body" style={{ color: IOS.textMuted }}>
              Aucune commande pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ borderBottom: `1px solid ${IOS.borderFaint}` }}>
                  <tr>
                    <th
                      className="text-left text-overline uppercase px-5 py-3"
                      style={{ color: IOS.textMuted }}
                    >
                      Commande
                    </th>
                    <th
                      className="text-left text-overline uppercase px-5 py-3"
                      style={{ color: IOS.textMuted }}
                    >
                      Client
                    </th>
                    <th
                      className="text-right text-overline uppercase px-5 py-3"
                      style={{ color: IOS.textMuted }}
                    >
                      Total
                    </th>
                    <th
                      className="text-left text-overline uppercase px-5 py-3"
                      style={{ color: IOS.textMuted }}
                    >
                      Statut
                    </th>
                    <th
                      className="text-right text-overline uppercase px-5 py-3"
                      style={{ color: IOS.textMuted }}
                    >
                      Reçue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const cfg = ORDER_STATUS[order.status];
                    return (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${IOS.borderFaint}` }}>
                        <td className="px-5 py-4">
                          <code className="font-mono text-caption" style={{ color: IOS.text }}>
                            {order.orderNumber}
                          </code>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-body-sm" style={{ color: IOS.textMuted }}>
                            {order.customer.firstName} {order.customer.lastName}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-medium text-body-sm" style={{ color: IOS.text }}>
                            {formatPrice(order.totalInCents)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-caption" style={{ color: IOS.textMuted }}>
                            {formatDateGuadeloupe(order.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
