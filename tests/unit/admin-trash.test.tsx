import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const deleteVehicule = vi.fn();
const restoreVehicule = vi.fn();
const markVehiculeVendu = vi.fn();
vi.mock('@/app/admin/vehicules/actions', () => ({
  deleteVehicule: (...a: unknown[]) => deleteVehicule(...a),
  restoreVehicule: (...a: unknown[]) => restoreVehicule(...a),
  markVehiculeVendu: (...a: unknown[]) => markVehiculeVendu(...a),
}));
const restoreProduct = vi.fn();
vi.mock('@/app/admin/products/actions', () => ({
  deleteProduct: vi.fn(),
  restoreProduct: (...a: unknown[]) => restoreProduct(...a),
  updateProductStock: vi.fn(),
}));

import { ToastProvider } from '@/components/ui/Toast';
import { TrashBanner } from '@/components/admin/Trash';
import { VehiculesTable } from '@/app/admin/(shell)/vehicules/VehiculesTable';
import { ProductsTable } from '@/app/admin/(shell)/products/ProductsTable';
import { VEHICULES } from '@/lib/vehicules';
import { PRODUCTS } from '@/lib/products';

import type { Vehicule } from '@/lib/vehicules';
import type { Product } from '@/lib/types';

const enLigne: Vehicule = { ...VEHICULES[0], id: 'v-ligne', marque: 'Peugeot', modele: '208' };
const supprime: Vehicule = {
  ...VEHICULES[0],
  id: 'v-suppr',
  marque: 'Dacia',
  modele: 'Sandero',
  disponibilite: 'vendu',
  updatedAt: '2026-10-04T10:00:00.000Z',
  deletedAt: '2026-10-04T10:00:00.000Z',
};

const monter = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

describe('Corbeille du BO', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('la liste ne montre que ce qui est en ligne ; la corbeille montre le reste', () => {
    monter(<VehiculesTable vehicules={[enLigne, supprime]} />);
    expect(screen.getByText('Peugeot 208')).toBeInTheDocument();
    expect(screen.queryByText('Dacia Sandero')).toBeNull();
    expect(screen.getByRole('tab', { name: 'En ligne · 1' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Corbeille · 1' }));
    expect(screen.queryByText('Peugeot 208')).toBeNull();
    const ligne = screen.getByText('Dacia Sandero').closest('tr')!;
    expect(ligne.textContent).toContain('Supprimé le 4 oct.');
    expect(ligne.textContent).toContain('était « Vendu »');
    expect(within(ligne).getByRole('link', { name: 'Éditer' })).toHaveAttribute(
      'href',
      '/admin/vehicules/v-suppr'
    );
  });

  it('Restaurer, depuis la corbeille, appelle l’action sous lock', async () => {
    restoreVehicule.mockResolvedValue({ ok: true });
    monter(<VehiculesTable vehicules={[enLigne, supprime]} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Corbeille · 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }));
    await waitFor(() =>
      expect(restoreVehicule).toHaveBeenCalledWith('v-suppr', '2026-10-04T10:00:00.000Z')
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('Supprimer part à la corbeille sans confirmation, et « Annuler » restaure', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    deleteVehicule.mockResolvedValue({ ok: true, updatedAt: '2026-10-04T12:00:00.000Z' });
    restoreVehicule.mockResolvedValue({ ok: true });
    monter(<VehiculesTable vehicules={[enLigne]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(deleteVehicule).toHaveBeenCalledWith('v-ligne', enLigne.updatedAt));
    expect(confirmSpy).not.toHaveBeenCalled();

    expect(await screen.findByText('« Peugeot 208 » est dans la corbeille.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    // Le lock de la restauration est l'horodatage rendu par la suppression.
    await waitFor(() =>
      expect(restoreVehicule).toHaveBeenCalledWith('v-ligne', '2026-10-04T12:00:00.000Z')
    );
  });

  it('un refus (édition concurrente) est affiché, jamais avalé', async () => {
    deleteVehicule.mockResolvedValue({
      errors: { _form: ['Ce véhicule a été modifié entre-temps.'] },
    });
    monter(<VehiculesTable vehicules={[enLigne]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(await screen.findByText('Ce véhicule a été modifié entre-temps.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler' })).toBeNull();
  });

  it('pièces : une pièce supprimée quitte la liste et se retrouve dans la corbeille', () => {
    const active: Product = { ...PRODUCTS[0], deletedAt: null };
    const jetee: Product = {
      ...PRODUCTS[1],
      deletedAt: '2026-10-01T08:00:00.000Z',
    };
    monter(<ProductsTable products={[active, jetee]} />);
    expect(screen.getByText(active.name)).toBeInTheDocument();
    expect(screen.queryByText(jetee.name)).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Corbeille · 1' }));
    expect(screen.getByText(jetee.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurer' })).toBeInTheDocument();
  });

  it('bandeau de la fiche : dit où est l’élément et le restaure', async () => {
    restoreProduct.mockResolvedValue({ ok: true });
    monter(
      <TrashBanner id="p1" updatedAt="2026-10-01T08:00:00.000Z" restoreAction={restoreProduct} />
    );
    expect(screen.getByText('Dans la corbeille')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }));
    await waitFor(() =>
      expect(restoreProduct).toHaveBeenCalledWith('p1', '2026-10-01T08:00:00.000Z')
    );
    expect(
      await screen.findByText('Restauré : de nouveau visible sur le site.')
    ).toBeInTheDocument();
  });
});
