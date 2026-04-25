'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/ui/Toast';
import type { Product } from '@/lib/types';

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = product.stock === 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    showToast({
      type: 'success',
      message: `${quantity} × ${product.name} ajouté au panier`,
      action: { label: 'Voir le panier', href: '/panier' },
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Quantity selector */}
      <div className="inline-flex items-center border border-lin bg-white rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          className="w-12 h-12 flex items-center justify-center hover:bg-lin/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Diminuer la quantité"
        >
          <Minus size={16} strokeWidth={2} />
        </button>
        <span
          className="w-14 h-12 flex items-center justify-center font-body font-medium text-basalt"
          aria-live="polite"
          aria-label={`Quantité : ${quantity}`}
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          disabled={quantity >= product.stock}
          className="w-12 h-12 flex items-center justify-center hover:bg-lin/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Augmenter la quantité"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isOutOfStock}
        onClick={handleAdd}
      >
        <ShoppingCart size={20} strokeWidth={2} />
        {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
      </Button>
    </div>
  );
}
