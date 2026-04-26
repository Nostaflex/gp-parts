'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Package, Mail } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/lib/types';

interface StoredOrder {
  orderNumber: string;
  items: CartItem[];
  total: number;
  deliveryPrice: number;
  email: string;
  deliveryOption: 'store-pickup' | 'island-delivery';
}

export default function ConfirmationPage() {
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('gpparts-last-order');
      if (saved) setOrder(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-[#E5DDD3] rounded-full mx-auto animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="cp-title font-black text-cp-ink text-3xl mb-4">Aucune commande récente</h1>
        <ButtonLink href="/pieces" variant="primary">
          Voir le catalogue
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-cp-vert-l/15 rounded-full mx-auto flex items-center justify-center mb-6">
          <CheckCircle size={40} strokeWidth={1.5} className="text-cp-vert-l" />
        </div>
        <p className="cp-mono text-xs text-cp-mango uppercase tracking-widest mb-3">
          Commande confirmée
        </p>
        <h1 className="cp-title font-black text-cp-ink text-4xl mb-3">MERCI POUR VOTRE COMMANDE</h1>
        <p className="text-cp-ink/55 text-base">
          Votre commande a bien été enregistrée. Nous vous contactons rapidement.
        </p>
      </div>

      {/* Order number */}
      <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 mb-6">
        <p className="cp-mono text-xs text-cp-ink/40 uppercase tracking-widest mb-1">
          Numéro de commande
        </p>
        <p className="cp-mono font-medium text-cp-ink text-2xl tracking-wider">
          {order.orderNumber}
        </p>
      </div>

      {/* Next steps */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#E5DDD3] p-5">
          <Mail size={24} strokeWidth={1.5} className="text-cp-mango mb-3" />
          <h3 className="font-semibold text-cp-ink text-sm mb-1">Email de confirmation</h3>
          <p className="text-xs text-cp-ink/50">
            Envoyé à <strong>{order.email}</strong>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5DDD3] p-5">
          <Package size={24} strokeWidth={1.5} className="text-cp-mango mb-3" />
          <h3 className="font-semibold text-cp-ink text-sm mb-1">
            {order.deliveryOption === 'store-pickup'
              ? 'Retrait en boutique'
              : 'Livraison à domicile'}
          </h3>
          <p className="text-xs text-cp-ink/50">
            {order.deliveryOption === 'store-pickup' ? 'Prêt sous 24h' : 'Livraison 24-48h'}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 mb-8">
        <h2 className="cp-title font-black text-cp-ink text-xl mb-4">Récapitulatif</h2>
        <div className="space-y-2 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-cp-ink/55">
                {item.quantity}× {item.name}
              </span>
              <span className="text-cp-ink font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E5DDD3] pt-4 flex justify-between items-baseline">
          <span className="cp-title font-black text-cp-ink text-lg">Total payé</span>
          <span className="cp-title font-black text-cp-mango text-2xl">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ButtonLink href="/" variant="outline" size="lg">
          Retour à l&apos;accueil
        </ButtonLink>
        <ButtonLink href="/pieces" variant="primary" size="lg">
          Continuer mes achats
        </ButtonLink>
      </div>
    </div>
  );
}
