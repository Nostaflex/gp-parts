import { describe, it, expect } from 'vitest';
import {
  computeStockKpis,
  guadeloupeBounds,
  computeOrderKpis,
} from '../../lib/admin/dashboard-kpis';
import { LOW_STOCK_THRESHOLD } from '../../lib/config';
import type { Order } from '../../lib/types';

// ─── computeStockKpis ────────────────────────────────────────────────
describe('computeStockKpis', () => {
  it('retourne des zéros sur un catalogue vide', () => {
    expect(computeStockKpis([])).toEqual({
      total: 0,
      lowStock: 0,
      outOfStock: 0,
      stockValueInCents: 0,
    });
  });

  it('classe rupture (0), stock faible (≤ seuil) et calcule la valeur', () => {
    const products = [
      { stock: 0, price: 10_00 }, // rupture — ne compte pas en stock faible
      { stock: LOW_STOCK_THRESHOLD, price: 20_00 }, // faible (borne incluse)
      { stock: LOW_STOCK_THRESHOLD + 1, price: 30_00 }, // sain
    ];
    expect(computeStockKpis(products)).toEqual({
      total: 3,
      lowStock: 1,
      outOfStock: 1,
      stockValueInCents: 20_00 * LOW_STOCK_THRESHOLD + 30_00 * (LOW_STOCK_THRESHOLD + 1),
    });
  });
});

// ─── guadeloupeBounds ────────────────────────────────────────────────
// La Guadeloupe est en UTC−4 fixe (pas d'heure d'été).
describe('guadeloupeBounds', () => {
  it('midi UTC → début du jour local = 04:00 UTC le même jour', () => {
    const { dayStartISO, monthStartISO } = guadeloupeBounds(new Date('2026-08-14T12:00:00Z'));
    expect(dayStartISO).toBe('2026-08-14T04:00:00.000Z');
    expect(monthStartISO).toBe('2026-08-01T04:00:00.000Z');
  });

  it('02:00 UTC → encore la veille en Guadeloupe (22h locales)', () => {
    const { dayStartISO } = guadeloupeBounds(new Date('2026-08-14T02:00:00Z'));
    expect(dayStartISO).toBe('2026-08-13T04:00:00.000Z');
  });

  it('1er du mois 03:59 UTC → encore le mois précédent en local', () => {
    const { monthStartISO } = guadeloupeBounds(new Date('2026-08-01T03:59:00Z'));
    expect(monthStartISO).toBe('2026-07-01T04:00:00.000Z');
  });
});

// ─── computeOrderKpis ────────────────────────────────────────────────
function order(patch: Partial<Order>): Order {
  return {
    id: 'o1',
    orderNumber: 'GP-TEST-0001',
    status: 'nouvelle',
    customer: {} as Order['customer'],
    delivery: {} as Order['delivery'],
    items: [],
    subtotalInCents: 0,
    totalInCents: 0,
    acceptsMarketing: false,
    createdAt: '2026-08-14T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    ...patch,
  };
}

describe('computeOrderKpis', () => {
  const now = new Date('2026-08-14T12:00:00Z'); // 8h locales en Guadeloupe

  it('CA du mois = somme des commandes payées du mois local uniquement', () => {
    const orders = [
      order({ totalInCents: 100_00, paymentStatus: 'paid', createdAt: '2026-08-10T12:00:00.000Z' }),
      order({ totalInCents: 50_00, paymentStatus: 'paid', createdAt: '2026-08-02T12:00:00.000Z' }),
      // Non payée — exclue du CA
      order({
        totalInCents: 999_00,
        paymentStatus: 'pending',
        createdAt: '2026-08-10T12:00:00.000Z',
      }),
      // Payée mais mois précédent (31 juillet local) — exclue
      order({ totalInCents: 999_00, paymentStatus: 'paid', createdAt: '2026-08-01T03:00:00.000Z' }),
    ];
    expect(computeOrderKpis(orders, now).caMoisInCents).toBe(150_00);
  });

  it("commandes du jour = créées aujourd'hui en heure locale, tous statuts", () => {
    const orders = [
      order({ createdAt: '2026-08-14T05:00:00.000Z' }), // 1h locale aujourd'hui
      order({ createdAt: '2026-08-14T03:00:00.000Z' }), // 23h locale la VEILLE
      order({ status: 'annulee', createdAt: '2026-08-14T11:00:00.000Z' }), // reçue aujourd'hui — compte
    ];
    expect(computeOrderKpis(orders, now).commandesJour).toBe(2);
  });

  it('liste vide → zéros', () => {
    expect(computeOrderKpis([], now)).toEqual({ caMoisInCents: 0, commandesJour: 0 });
  });
});
