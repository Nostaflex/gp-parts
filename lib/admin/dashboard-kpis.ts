// KPIs du tableau de bord admin — fonctions pures, testées unitairement.
// Les bornes temporelles sont calculées en heure de Guadeloupe : UTC−4 fixe
// (pas d'heure d'été), ce qui évite une dépendance à la TZ du serveur (Vercel = UTC).
import { LOW_STOCK_THRESHOLD } from '@/lib/config';
import type { Order } from '@/lib/types';

const GUADELOUPE_UTC_OFFSET_MS = 4 * 60 * 60 * 1000; // UTC−4

export type StockKpis = {
  total: number;
  lowStock: number;
  outOfStock: number;
  stockValueInCents: number;
};

export function computeStockKpis(products: { stock: number; price: number }[]): StockKpis {
  let lowStock = 0;
  let outOfStock = 0;
  let stockValueInCents = 0;
  for (const p of products) {
    if (p.stock === 0) outOfStock += 1;
    else if (p.stock <= LOW_STOCK_THRESHOLD) lowStock += 1;
    stockValueInCents += p.price * p.stock;
  }
  return { total: products.length, lowStock, outOfStock, stockValueInCents };
}

/** Débuts du jour et du mois courants (heure Guadeloupe), en ISO UTC. */
export function guadeloupeBounds(now: Date): { dayStartISO: string; monthStartISO: string } {
  const local = new Date(now.getTime() - GUADELOUPE_UTC_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  return {
    dayStartISO: new Date(Date.UTC(y, m, d) + GUADELOUPE_UTC_OFFSET_MS).toISOString(),
    monthStartISO: new Date(Date.UTC(y, m, 1) + GUADELOUPE_UTC_OFFSET_MS).toISOString(),
  };
}

export type OrderKpis = {
  /** Somme des commandes payées (Stripe) créées ce mois-ci en heure locale. */
  caMoisInCents: number;
  /** Commandes reçues aujourd'hui, tous statuts (une annulation n'annule pas la réception). */
  commandesJour: number;
};

export function computeOrderKpis(orders: Order[], now: Date): OrderKpis {
  const { dayStartISO, monthStartISO } = guadeloupeBounds(now);
  let caMoisInCents = 0;
  let commandesJour = 0;
  for (const o of orders) {
    // createdAt est un ISO UTC : la comparaison lexicographique est chronologique.
    if (o.paymentStatus === 'paid' && o.createdAt >= monthStartISO) {
      caMoisInCents += o.totalInCents;
    }
    if (o.createdAt >= dayStartISO) commandesJour += 1;
  }
  return { caMoisInCents, commandesJour };
}
