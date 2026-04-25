'use client';

import { ShoppingCart, ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, totalPrice, isReady } = useCart();

  if (!isReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-[#E5DDD3] rounded w-1/3 mb-6" />
        <div className="h-32 bg-[#E5DDD3] rounded mb-4" />
        <div className="h-32 bg-[#E5DDD3] rounded" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-cp-ink/8 rounded-full mx-auto flex items-center justify-center mb-6">
          <ShoppingCart size={32} strokeWidth={1.5} className="text-cp-ink/40" />
        </div>
        <h1 className="cp-title font-black text-cp-ink text-3xl mb-3">Votre panier est vide</h1>
        <p className="text-cp-ink/55 text-base mb-8">
          Parcourez notre catalogue pour trouver la pièce qu&apos;il vous faut.
        </p>
        <ButtonLink href="/pieces" variant="primary" size="lg">
          Voir le catalogue <ArrowRight size={20} />
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="cp-title font-black text-cp-ink text-4xl mb-8">VOTRE PANIER</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5DDD3] p-6">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <aside className="bg-white rounded-2xl border border-[#E5DDD3] shadow-[0_4px_24px_rgba(26,15,6,0.06)] p-6 h-fit sticky top-24">
          <h2 className="cp-title font-black text-cp-ink text-xl mb-6">Résumé</h2>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-cp-ink/55">Sous-total</dt>
              <dd className="font-medium text-cp-ink">{formatPrice(totalPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cp-ink/55">Livraison</dt>
              <dd className="text-cp-vert-l font-medium">À l&apos;étape suivante</dd>
            </div>
          </dl>

          <div className="border-t border-[#E5DDD3] my-6" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="cp-title font-black text-cp-ink text-lg">Total</span>
            <span className="cp-title font-black text-cp-mango text-2xl">
              {formatPrice(totalPrice)}
            </span>
          </div>

          <ButtonLink href="/commande" variant="primary" size="lg" fullWidth className="mb-3">
            Passer la commande <ArrowRight size={20} />
          </ButtonLink>

          <ButtonLink href="/pieces" variant="ghost" size="sm" fullWidth>
            Continuer mes achats
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
}
