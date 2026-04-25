import { Suspense } from 'react';
import { CatalogueClient } from './CatalogueClient';

export const metadata = {
  title: 'Catalogue',
  description: 'Catalogue complet des pièces détachées auto et moto disponibles en Guadeloupe.',
};

export default function CataloguePage() {
  return (
    <Suspense fallback={<CatalogueSkeleton />}>
      <CatalogueClient />
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
