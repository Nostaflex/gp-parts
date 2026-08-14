import { ProductForm } from '@/components/admin/ProductForm';
import { requireAdminPage } from '@/lib/admin/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouveau produit — Admin GP Parts',
};

export default async function NewProductPage() {
  await requireAdminPage();
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouveau produit</h1>
      <ProductForm />
    </div>
  );
}
