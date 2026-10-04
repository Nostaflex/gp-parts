import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/auth';

import { ProductForm } from '@/components/admin/ProductForm';
import { TrashBanner } from '@/components/admin/Trash';
import { getProductByIdAdmin } from '@/lib/admin/catalogue-server';
import { restoreProduct } from '@/app/admin/products/actions';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Éditer produit — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const product = await getProductByIdAdmin(id);
  if (!product) notFound();

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">{product.name}</h1>

      {product.deletedAt && (
        <TrashBanner id={product.id} updatedAt={product.updatedAt} restoreAction={restoreProduct} />
      )}

      <ProductForm initial={product} />
    </div>
  );
}
