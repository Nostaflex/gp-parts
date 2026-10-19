/**
 * Tableau de bord — le message d'en-tête ne rassure pas à tort
 * (analyse BO du 18/10, F4) : un comptage en échec affichait des zéros et
 * « Tout est traité — rien en attente. ».
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { DashboardData } from '@/lib/admin/dashboard-server';

const { getDashboardDataMock } = vi.hoisted(() => ({ getDashboardDataMock: vi.fn() }));

vi.mock('@/lib/admin/auth', () => ({ requireAdminPage: vi.fn(async () => ({ uid: 'u1' })) }));
vi.mock('@/lib/admin/dashboard-server', () => ({ getDashboardData: getDashboardDataMock }));

import AdminDashboardPage from '@/app/admin/(shell)/dashboard/page';

function donnees(badges: DashboardData['badges']): DashboardData {
  return {
    badges,
    orders: { caMoisInCents: 0, commandesJour: 0 },
    stock: { total: 3, lowStock: 1, outOfStock: 0, stockValueInCents: 0 },
    catalogue: { vehiculesDispo: 2, motosDispo: 0 },
    recentOrders: [],
  };
}

async function afficher(data: DashboardData) {
  getDashboardDataMock.mockResolvedValue(data);
  render(await AdminDashboardPage());
}

describe('Tableau de bord — en-tête « à traiter »', () => {
  it('comptage indisponible → le dit, n’affiche ni zéro ni « Tout est traité »', async () => {
    await afficher(donnees(null));
    expect(screen.getByText(/Compteurs indisponibles/)).toBeInTheDocument();
    expect(screen.queryByText(/Tout est traité/)).toBeNull();
    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  it('rien en attente → message limité à ce qu’il compte', async () => {
    await afficher(donnees({ commandes: 0, reservations: 0, demandes: 0, avis: 0 }));
    expect(screen.getByText('Aucun dossier ni avis en attente.')).toBeInTheDocument();
  });

  it('éléments en attente → les compte', async () => {
    await afficher(donnees({ commandes: 1, reservations: 0, demandes: 2, avis: 0 }));
    expect(screen.getByText('3 éléments en attente de traitement.')).toBeInTheDocument();
  });
});
