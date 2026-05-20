import Link from 'next/link';

import { getAdapter } from '@/lib/data';

import { ProductsTable } from './ProductsTable';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Produits — Admin GP Parts',
};

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const adapter = await getAdapter();
  const products = await adapter.getProducts({ includeDeleted: true });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title font-semibold text-[var(--text)]">Produits</h1>
        <Link
          href="/admin/products/new"
          className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white inline-flex items-center"
          style={{ background: 'var(--blue)' }}
        >
          + Nouveau produit
        </Link>
      </div>
      <ProductsTable products={products} />
    </div>
  );
}
