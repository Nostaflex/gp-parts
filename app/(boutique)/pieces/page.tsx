import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCachedProducts } from '@/lib/data/products-cache';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { CatalogueClient } from './CatalogueClient';

export const metadata = {
  title: 'Catalogue',
  description: 'Catalogue complet des pièces détachées auto et moto disponibles en Guadeloupe.',
  alternates: { canonical: '/pieces' },
};

// Symétrie ISR avec [slug]/page.tsx : revalidateTag('products') prime sur
// mutation ; ce TTL n'est qu'un fallback de fraîcheur.
export const revalidate = 3600;

export default async function CataloguePage() {
  const flags = await getCachedFeatureFlags();
  if (!flags.pieces) notFound();
  const products = await getCachedProducts();
  return (
    <Suspense fallback={<CatalogueSkeleton />}>
      <CatalogueClient products={products} />
    </Suspense>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="h-8 bg-lin rounded w-48 mb-6" />
      <div className="h-12 bg-lin rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 bg-lin rounded-xl" />
        ))}
      </div>
    </div>
  );
}
