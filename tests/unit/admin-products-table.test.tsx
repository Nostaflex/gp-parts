/**
 * Liste des pièces — retour du stock −/+ (analyse BO du 18/10, F7) : un refus
 * du serveur ne produisait aucun message.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const updateProductStock = vi.fn();
vi.mock('@/app/admin/products/actions', () => ({
  deleteProduct: vi.fn(),
  restoreProduct: vi.fn(),
  updateProductStock: (...a: unknown[]) => updateProductStock(...a),
}));

import { ToastProvider } from '@/components/ui/Toast';
import { ProductsTable } from '@/app/admin/(shell)/products/ProductsTable';
import { PRODUCTS } from '@/lib/products';

import type { Product } from '@/lib/types';

const piece: Product = { ...PRODUCTS[0], stock: 12, deletedAt: null };

const monter = (products: Product[]) =>
  render(
    <ToastProvider>
      <ProductsTable products={products} />
    </ToastProvider>
  );

describe('Liste des pièces — stock −/+', () => {
  beforeEach(() => vi.clearAllMocks());

  it('un refus du serveur s’affiche', async () => {
    updateProductStock.mockResolvedValue({ errors: { _form: ['Identifiant produit invalide.'] } });
    monter([piece]);
    fireEvent.click(screen.getByRole('button', { name: /Ajouter 1 au stock de/ }));
    expect(await screen.findByText('Identifiant produit invalide.')).toBeInTheDocument();
  });
});
