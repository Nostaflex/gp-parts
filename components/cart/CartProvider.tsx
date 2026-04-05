'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { PRODUCTS } from '@/lib/products';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isReady: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'gpparts-cart';

/**
 * Re-synchronise un CartItem persisté avec la source PRODUCTS :
 * - Produit disparu → item éliminé
 * - Prix / nom / stock mis à jour depuis la source
 * - Quantité clampée sur le stock courant
 * - Rupture → item éliminé
 */
function rehydrateItems(persisted: CartItem[]): CartItem[] {
  const out: CartItem[] = [];
  for (const stored of persisted) {
    const live = PRODUCTS.find((p) => p.id === stored.productId);
    if (!live) continue; // produit retiré du catalogue
    if (live.stock === 0) continue; // rupture : on retire du panier
    out.push({
      id: live.id,
      productId: live.id,
      slug: live.slug,
      name: live.name,
      reference: live.reference,
      price: live.price,
      quantity: Math.min(Math.max(1, stored.quantity), live.stock),
      image: live.images[0] || '',
      stock: live.stock,
    });
  }
  return out;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Charge le panier depuis localStorage côté client uniquement (anti-hydratation)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(rehydrateItems(parsed as CartItem[]));
        }
      }
    } catch {
      // Corrupt data — on ignore silencieusement
    }
    setIsReady(true);
  }, []);

  // Persiste à chaque changement, MAIS seulement après le chargement initial
  useEffect(() => {
    if (isReady) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Quota exceeded — on ignore
      }
    }
  }, [items, isReady]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    if (product.stock === 0) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          reference: product.reference,
          price: product.price,
          quantity: Math.min(quantity, product.stock),
          image: product.images[0] || '',
          stock: product.stock,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.id !== itemId);
      return prev.map((i) =>
        i.id === itemId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const { totalItems, totalPrice } = useMemo(() => {
    let count = 0;
    let price = 0;
    for (const i of items) {
      count += i.quantity;
      price += i.price * i.quantity;
    }
    return { totalItems: count, totalPrice: price };
  }, [items]);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isReady,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isReady]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider');
  return ctx;
}
