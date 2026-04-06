'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, getStockStatus, getStockLabel } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/categories';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

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
    <article className="group bg-ivory rounded-xl p-4 shadow-subtle hover:shadow-medium transition-shadow duration-normal flex flex-col">
      <Link
        href={`/catalogue/${product.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volcanic focus-visible:ring-offset-2 rounded-lg"
      >
        {/* Image produit — 1:1 ratio */}
        <div className="aspect-square bg-lin rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain p-4"
              loading="lazy"
            />
          ) : (
            <span className="text-overline uppercase text-basalt/30">Image produit</span>
          )}
          {hasPromo && (
            <span className="absolute top-2 left-2">
              <Badge variant="promo">-{promoPercent}%</Badge>
            </span>
          )}
        </div>
      </Link>

      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-overline uppercase text-basalt/60">
            {getCategoryLabel(product.category)}
          </span>
          <Badge variant={stockStatus}>{getStockLabel(product.stock)}</Badge>
        </div>

        <Link
          href={`/catalogue/${product.slug}`}
          className="font-title text-h4 text-basalt hover:text-volcanic transition-colors leading-tight mb-1"
        >
          {product.name}
        </Link>
        <p className="text-caption font-mono text-basalt/60 mb-2">{product.reference}</p>
        <p className="text-body-sm text-basalt/70 mb-4 line-clamp-2">{product.shortDescription}</p>

        <div className="flex items-baseline gap-2 mt-auto mb-3">
          <span className="font-title text-h3 text-volcanic">{formatPrice(product.price)}</span>
          {hasPromo && (
            <span className="text-body-sm text-basalt/40 line-through">
              {formatPrice(product.priceOriginal!)}
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          fullWidth
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} strokeWidth={2} />
          {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
        </Button>
      </div>
    </article>
  );
}
