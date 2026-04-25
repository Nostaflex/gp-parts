'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, getStockStatus, getStockLabel } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

const STOCK_DOT: Record<string, string> = {
  'in-stock': 'bg-[#52C88A]',
  'low-stock': 'bg-[#E9C46A]',
  'out-of-stock': 'bg-[#B85450]',
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    addItem(product, 1);
    showToast({
      type: 'success',
      message: `${product.name} ajouté au panier`,
      action: { label: 'Voir le panier', href: '/panier' },
    });
  };

  const stockStatus = getStockStatus(product.stock);
  const isOutOfStock = stockStatus === 'out-of-stock';
  const hasPromo = product.priceOriginal && product.priceOriginal > product.price;
  const promoPercent = hasPromo
    ? Math.round(((product.priceOriginal! - product.price) / product.priceOriginal!) * 100)
    : 0;

  return (
    <article className="group relative bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,15,6,0.10)] hover:border-[rgba(232,114,0,0.2)] flex flex-col">
      {/* Badge promo */}
      {hasPromo && (
        <span className="absolute top-4 left-4 z-10 cp-mono text-[11px] font-medium bg-cp-mango text-white px-2.5 py-1 rounded-full">
          −{promoPercent}%
        </span>
      )}

      {/* Badge stock faible / rupture */}
      {stockStatus === 'low-stock' && (
        <span className="absolute top-4 right-4 z-10 text-[11px] font-semibold bg-[#E9C46A]/15 text-[#B8860B] px-2.5 py-1 rounded-full">
          Stock faible
        </span>
      )}
      {isOutOfStock && (
        <span className="absolute top-4 right-4 z-10 text-[11px] font-semibold bg-[#B85450]/10 text-[#B85450] px-2.5 py-1 rounded-full">
          Rupture
        </span>
      )}

      {/* Image */}
      <Link
        href={`/pieces/${product.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cp-mango focus-visible:ring-offset-2"
        tabIndex={0}
      >
        <div
          className={`aspect-[4/3] bg-[#F8F5F0] flex items-center justify-center relative overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              width={400}
              height={300}
              className="w-full h-full object-contain p-6"
            />
          ) : (
            <svg
              className="w-16 h-16 text-cp-ink/10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              viewBox="0 0 80 80"
              aria-hidden="true"
            >
              <rect x="10" y="25" width="60" height="35" rx="4" />
              <circle cx="25" cy="60" r="8" />
              <circle cx="55" cy="60" r="8" />
              <path d="M10 38h60M25 25l5-10h20l5 10" />
            </svg>
          )}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(26,15,6,0.04)]"
            aria-hidden="true"
          />
        </div>
      </Link>

      {/* Infos */}
      <div className="p-5 flex flex-col flex-1">
        <p className="cp-mono text-[11px] text-cp-ink/35 mb-1.5">{product.reference}</p>

        <Link
          href={`/pieces/${product.slug}`}
          className="cp-title font-bold text-[1.125rem] text-cp-ink leading-tight mb-1 hover:text-cp-mango transition-colors"
        >
          {product.name}
        </Link>

        {product.shortDescription && (
          <p className="text-[0.8125rem] text-cp-ink/50 leading-relaxed mb-4 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Prix */}
        <div className="flex items-baseline gap-2 mt-auto mb-4">
          {hasPromo ? (
            <>
              <span className="cp-title font-black text-[1.375rem] text-cp-mango">
                {formatPrice(product.price)}
              </span>
              <span className="text-[0.875rem] text-cp-ink/30 line-through">
                {formatPrice(product.priceOriginal!)}
              </span>
            </>
          ) : (
            <span className="cp-title font-black text-[1.375rem] text-cp-ink">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STOCK_DOT[stockStatus]}`} />
          <span className="text-[0.75rem] text-cp-ink/50">{getStockLabel(product.stock)}</span>
        </div>

        {/* CTA */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[0.875rem] font-semibold transition-colors ${
            isOutOfStock
              ? 'bg-[#E5DDD3] text-cp-ink/30 cursor-not-allowed'
              : 'bg-cp-ink text-cp-cream hover:bg-cp-mango'
          }`}
        >
          <ShoppingCart size={15} strokeWidth={2} />
          {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
        </button>
      </div>
    </article>
  );
}
