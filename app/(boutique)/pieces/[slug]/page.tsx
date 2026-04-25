import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ChevronRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AddToCartButton } from './AddToCartButton';
import { getAdapter } from '@/lib/data';
import { formatPrice, getStockStatus, getStockLabel } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/categories';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const adapter = await getAdapter();
  const products = await adapter.getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const adapter = await getAdapter();
  const product = await adapter.getProductBySlug(params.slug);
  if (!product) return { title: 'Produit introuvable' };
  return {
    title: `${product.name} — ${product.reference}`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const adapter = await getAdapter();
  const product = await adapter.getProductBySlug(params.slug);
  if (!product) notFound();

  const stockStatus = getStockStatus(product.stock);
  const hasPromo = product.priceOriginal && product.priceOriginal > product.price;

  // JSON-LD Product
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.reference,
    brand: { '@type': 'Brand', name: product.compatibility[0]?.brand ?? 'GP Parts' },
    offers: {
      '@type': 'Offer',
      price: (product.price / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-6">
          <ol className="flex items-center gap-2 text-body-sm text-basalt/60 flex-wrap">
            <li>
              <Link href="/" className="hover:text-volcanic transition-colors">
                Accueil
              </Link>
            </li>
            <ChevronRight size={14} className="text-basalt/30" />
            <li>
              <Link href="/pieces" className="hover:text-volcanic transition-colors">
                Catalogue
              </Link>
            </li>
            <ChevronRight size={14} className="text-basalt/30" />
            <li>
              <Link
                href={`/pieces?category=${product.category}`}
                className="hover:text-volcanic transition-colors"
              >
                {getCategoryLabel(product.category)}
              </Link>
            </li>
            <ChevronRight size={14} className="text-basalt/30" />
            <li className="text-basalt font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image */}
          <div>
            <div className="aspect-square bg-ivory rounded-2xl shadow-subtle flex items-center justify-center overflow-hidden">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-contain p-8"
                  priority
                />
              ) : (
                <span className="text-overline uppercase text-basalt/30">Image {product.name}</span>
              )}
            </div>
          </div>

          {/* Infos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="category">{getCategoryLabel(product.category)}</Badge>
              <Badge variant={stockStatus}>{getStockLabel(product.stock)}</Badge>
              {product.isPromoted && <Badge variant="promo">Promo</Badge>}
            </div>

            <h1 className="font-title text-h1 text-basalt mb-2">{product.name}</h1>
            <p className="font-mono text-body-sm text-basalt/60 mb-6">{product.reference}</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-title text-display text-volcanic">
                {formatPrice(product.price)}
              </span>
              {hasPromo && (
                <span className="text-body-lg text-basalt/40 line-through">
                  {formatPrice(product.priceOriginal!)}
                </span>
              )}
            </div>

            <p className="text-body text-basalt/80 leading-relaxed mb-8">{product.description}</p>

            {/* Compatibilité */}
            <div className="bg-ivory rounded-xl p-5 mb-6">
              <h2 className="text-overline uppercase text-basalt/60 mb-3">Compatible avec</h2>
              <ul className="space-y-2">
                {product.compatibility.map((c, idx) => (
                  <li key={idx} className="text-body-sm text-basalt">
                    <span className="font-medium">
                      {c.brand} {c.model}
                    </span>
                    <span className="text-basalt/60">
                      {' '}
                      · {c.yearFrom}
                      {c.yearTo ? `–${c.yearTo}` : '+'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {/* Garanties */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-lin">
              {[
                { icon: <Truck size={20} strokeWidth={1.5} />, label: 'Livraison 24h' },
                { icon: <Shield size={20} strokeWidth={1.5} />, label: 'Garantie origine' },
                { icon: <RefreshCw size={20} strokeWidth={1.5} />, label: 'Retour 14 jours' },
              ].map((g) => (
                <div key={g.label} className="flex flex-col items-center text-center gap-1">
                  <div className="text-volcanic">{g.icon}</div>
                  <span className="text-caption text-basalt/70">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
