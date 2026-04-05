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
        <div className="h-8 bg-lin rounded w-1/3 mb-6" />
        <div className="h-32 bg-lin rounded mb-4" />
        <div className="h-32 bg-lin rounded" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-volcanic/10 rounded-full mx-auto flex items-center justify-center mb-6">
          <ShoppingCart size={32} strokeWidth={1.5} className="text-volcanic" />
        </div>
        <h1 className="font-title text-h2 text-basalt mb-3">Votre panier est vide</h1>
        <p className="text-body text-basalt/60 mb-8">
          Parcourez notre catalogue pour trouver la pièce qu&apos;il vous faut.
        </p>
        <ButtonLink href="/catalogue" variant="primary" size="lg">
          Voir le catalogue <ArrowRight size={20} />
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-title text-h1 text-basalt mb-8">Votre panier</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 bg-ivory rounded-2xl p-6">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <aside className="bg-white rounded-2xl shadow-subtle p-6 h-fit sticky top-24">
          <h2 className="font-title text-h3 text-basalt mb-6">Résumé</h2>

          <dl className="space-y-3 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-basalt/70">Sous-total</dt>
              <dd className="font-medium text-basalt">{formatPrice(totalPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-basalt/70">Livraison</dt>
              <dd className="text-caribbean font-medium">À l&apos;étape suivante</dd>
            </div>
          </dl>

          <div className="border-t border-lin my-6" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="font-title text-h4 text-basalt">Total</span>
            <span className="font-title text-h2 text-volcanic">{formatPrice(totalPrice)}</span>
          </div>

          <ButtonLink href="/commande" variant="primary" size="lg" fullWidth className="mb-3">
            Passer la commande <ArrowRight size={20} />
          </ButtonLink>

          <ButtonLink href="/catalogue" variant="ghost" size="sm" fullWidth>
            Continuer mes achats
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
}
