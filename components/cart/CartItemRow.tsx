'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from './CartProvider';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/lib/types';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-lin last:border-0">
      <div className="w-20 h-20 bg-lin rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={80}
            height={80}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span className="text-caption text-basalt/40">IMG</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/catalogue/${item.slug}`}
          className="text-body font-body font-medium text-basalt hover:text-volcanic transition-colors"
        >
          {item.name}
        </Link>
        <p className="text-caption font-mono text-basalt/60 mt-1">{item.reference}</p>

        <div className="flex items-center gap-3 mt-3">
          <div className="inline-flex items-center border border-lin rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center bg-lin/50 hover:bg-lin transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={item.quantity <= 1}
              aria-label="Diminuer la quantité"
            >
              <Minus size={14} strokeWidth={2} />
            </button>
            <span
              className="w-10 h-8 flex items-center justify-center text-body-sm font-medium"
              aria-live="polite"
              aria-label={`Quantité ${item.quantity}`}
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center bg-lin/50 hover:bg-lin transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={item.quantity >= item.stock}
              aria-label="Augmenter la quantité"
              title={
                item.quantity >= item.stock ? `Stock maximum atteint (${item.stock})` : undefined
              }
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="text-basalt/40 hover:text-error transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            aria-label={`Supprimer ${item.name}`}
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-title text-h4 text-volcanic">
          {formatPrice(item.price * item.quantity)}
        </p>
        {item.quantity > 1 && (
          <p className="text-caption text-basalt/60">{formatPrice(item.price)} / unité</p>
        )}
      </div>
    </div>
  );
}
