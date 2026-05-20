import { ProductForm } from '@/components/admin/ProductForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouveau produit — Admin GP Parts',
};

export default function NewProductPage() {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-title font-semibold text-[var(--text)] mb-4">Nouveau produit</h1>
      <ProductForm />
    </div>
  );
}
