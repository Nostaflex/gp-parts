// Agrégation des données du dashboard hub — une seule fonction appelée par le
// Server Component. Lectures : badges « à traiter » (count(), fail-open),
// commandes du mois (KPIs), catalogue pièces (stock), 5 dernières commandes.
import { getNavBadges, type NavBadges } from '@/lib/admin/nav-badges';
import { getOrdersAdmin } from '@/lib/admin/orders-server';
import {
  computeOrderKpis,
  computeStockKpis,
  guadeloupeBounds,
  type OrderKpis,
  type StockKpis,
} from '@/lib/admin/dashboard-kpis';
import { getCachedProducts } from '@/lib/data/products-cache';
import { getCachedVehicules } from '@/lib/data/vehicules-cache';
import { getCachedMotos } from '@/lib/data/motos-cache';
import type { Order } from '@/lib/types';

export type DashboardData = {
  badges: NavBadges;
  orders: OrderKpis;
  stock: StockKpis;
  /** Compteurs de la grille pôles : annonces disponibles à la vente. */
  catalogue: { vehiculesDispo: number; motosDispo: number };
  recentOrders: Order[];
};

export async function getDashboardData(now: Date = new Date()): Promise<DashboardData> {
  const { monthStartISO } = guadeloupeBounds(now);
  const [badges, monthOrders, products, vehicules, motos, recentOrders] = await Promise.all([
    getNavBadges(),
    // Le mois local couvre aussi « aujourd'hui » : une seule requête pour les deux KPIs.
    getOrdersAdmin({ since: new Date(monthStartISO) }),
    getCachedProducts(),
    getCachedVehicules(),
    getCachedMotos(),
    getOrdersAdmin({ limit: 5 }),
  ]);
  return {
    badges,
    orders: computeOrderKpis(monthOrders, now),
    stock: computeStockKpis(products),
    catalogue: {
      vehiculesDispo: vehicules.filter((v) => v.disponibilite === 'disponible').length,
      motosDispo: motos.filter((m) => m.disponibilite === 'disponible').length,
    },
    recentOrders,
  };
}
