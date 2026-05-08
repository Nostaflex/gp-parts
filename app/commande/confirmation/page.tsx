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
        <div className="w-16 h-16 bg-lin rounded-full mx-auto animate-skeleton" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-title text-h2 text-basalt mb-4">Aucune commande récente</h1>
        <ButtonLink href="/catalogue" variant="primary">
          Voir le catalogue
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="w-20 h-20 bg-caribbean/10 rounded-full mx-auto flex items-center justify-center mb-6">
          <CheckCircle size={40} strokeWidth={1.5} className="text-caribbean" />
        </div>
        <h1 className="font-title text-h1 text-basalt mb-3">Commande confirmée</h1>
        <p className="text-body-lg text-basalt/70">
          Merci pour votre confiance ! Votre commande a été enregistrée.
        </p>
      </div>

      {/* Order number */}
      <div className="bg-ivory rounded-2xl p-6 mb-6">
        <p className="text-overline uppercase text-basalt/60 mb-1">Numéro de commande</p>
        <p className="font-mono text-h3 text-basalt">{order.orderNumber}</p>
      </div>

      {/* Next steps */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-subtle">
          <Mail size={24} strokeWidth={1.5} className="text-volcanic mb-3" />
          <h3 className="font-medium text-body text-basalt mb-1">Email de confirmation</h3>
          <p className="text-caption text-basalt/60">
            Envoyé à <strong>{order.email}</strong>
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-subtle">
          <Package size={24} strokeWidth={1.5} className="text-volcanic mb-3" />
          <h3 className="font-medium text-body text-basalt mb-1">
            {order.deliveryOption === 'store-pickup'
              ? 'Retrait en boutique'
              : 'Livraison à domicile'}
          </h3>
          <p className="text-caption text-basalt/60">
            {order.deliveryOption === 'store-pickup' ? 'Prêt sous 24h' : 'Livraison 24-48h'}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-ivory rounded-2xl p-6 mb-8">
        <h2 className="font-title text-h3 text-basalt mb-4">Récapitulatif</h2>
        <div className="space-y-2 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-body-sm">
              <span className="text-basalt/70">
                {item.quantity}× {item.name}
              </span>
              <span className="text-basalt font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-lin pt-4 flex justify-between items-baseline">
          <span className="font-title text-h4 text-basalt">Total payé</span>
          <span className="font-title text-h2 text-volcanic">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ButtonLink href="/" variant="outline" size="lg">
          Retour à l&apos;accueil
        </ButtonLink>
        <ButtonLink href="/catalogue" variant="primary" size="lg">
          Continuer mes achats
        </ButtonLink>
      </div>
    </div>
  );
}
