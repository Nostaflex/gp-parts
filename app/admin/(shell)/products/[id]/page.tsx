import { notFound } from 'next/navigation';

import { ProductForm } from '@/components/admin/ProductForm';
import { getAdapter } from '@/lib/data';
import { restoreProduct } from '@/app/admin/products/actions';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer produit — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adapter = await getAdapter();
  const product = await adapter.getProductById(id, { includeDeleted: true });
  if (!product) notFound();

  async function restoreAction() {
    'use server';
    await restoreProduct(product!.id, product!.updatedAt);
  }

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">{product.name}</h1>

      {product.deletedAt && (
        <form action={restoreAction} className="mb-4">
          <div className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3">
            <p className="text-body-sm text-[var(--text)]">
              Ce produit est supprimé (soft-delete). Restaurer le rend à nouveau visible.
            </p>
            <button
              type="submit"
              className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white"
              style={{ background: 'var(--blue)' }}
            >
              Restaurer
            </button>
          </div>
        </form>
      )}

      <ProductForm initial={product} />
    </div>
  );
}
