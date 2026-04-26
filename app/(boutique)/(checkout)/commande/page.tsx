'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Truck, Store, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, cn } from '@/lib/utils';
import { validateCheckout } from './actions';
import { DELIVERY_OPTIONS_CONFIG, getDeliveryPrice } from '@/lib/config';
import type { OrderInfo } from '@/lib/types';

// Enrichi avec les icônes Lucide (client-only) — prix depuis config.ts (source unique)
const DELIVERY_OPTIONS = DELIVERY_OPTIONS_CONFIG.map((opt) => ({
  ...opt,
  price: opt.priceInCents,
  icon: opt.id === 'store-pickup' ? Store : Truck,
}));

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, isReady } = useCart();
  const { showToast } = useToast();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [form, setForm] = useState<OrderInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    deliveryOption: 'island-delivery',
    acceptsCgv: false,
    acceptsMarketing: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OrderInfo, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  // Flag pour éviter la race condition : après une commande validée, clearCart()
  // déclenche un re-render avec items=[] qui ferait rediriger vers /panier.
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (isReady && items.length === 0 && !orderPlaced) {
      router.push('/panier');
    }
  }, [isReady, items, router, orderPlaced]);

  const deliveryPrice = getDeliveryPrice(form.deliveryOption);
  const total = totalPrice + deliveryPrice;

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.firstName.trim()) errs.firstName = 'Prénom requis';
    if (!form.lastName.trim()) errs.lastName = 'Nom requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (!/^[0-9+\s().-]{8,}$/.test(form.phone)) errs.phone = 'Téléphone invalide';
    if (form.deliveryOption === 'island-delivery') {
      if (!form.address.trim()) errs.address = 'Adresse requise';
      if (!form.city.trim()) errs.city = 'Ville requise';
      if (!/^971\d{2}$/.test(form.postalCode)) errs.postalCode = 'Code postal Guadeloupe (971xx)';
    }
    if (!form.acceptsCgv) errs.acceptsCgv = 'Vous devez accepter les CGV';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!validate()) {
      showToast({
        type: 'warning',
        message: 'Certains champs sont invalides. Vérifiez le formulaire.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = await validateCheckout({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        deliveryOption: form.deliveryOption,
        acceptsCgv: form.acceptsCgv,
        acceptsMarketing: form.acceptsMarketing,
        items,
        subtotalInCents: totalPrice,
      });

      if (!result.success) {
        setSubmitting(false);
        setErrors(result.errors as typeof errors);
        showToast({
          type: 'error',
          message: 'Validation serveur échouée. Vérifiez le formulaire.',
        });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      const shouldFail = Math.random() < 0.05;
      if (shouldFail) {
        setSubmitting(false);
        setPaymentError(
          'Le paiement simulé a échoué (code mock ERR_DECLINED). Réessayez — 95% des tentatives aboutissent.'
        );
        showToast({ type: 'error', message: 'Paiement refusé — réessayez' });
        return;
      }

      try {
        const maskedEmail = form.email.replace(
          /^(.{2})(.*)(@.*)$/,
          (_, start, middle, domain) => start + '*'.repeat(middle.length) + domain
        );
        sessionStorage.setItem(
          'gpparts-last-order',
          JSON.stringify({
            orderNumber: result.orderNumber,
            items,
            total,
            deliveryPrice,
            email: maskedEmail,
            deliveryOption: form.deliveryOption,
          })
        );
      } catch {}

      // Marquer AVANT clearCart() — anti race condition Bug #3
      setOrderPlaced(true);
      clearCart();
      router.push('/commande/confirmation');
    } catch {
      setSubmitting(false);
      setPaymentError('Une erreur est survenue. Réessayez.');
      showToast({ type: 'error', message: 'Erreur inattendue — réessayez' });
    }
  };

  if (!isReady || (items.length === 0 && !orderPlaced)) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="cp-title font-black text-cp-ink text-4xl mb-2">FINALISER VOTRE COMMANDE</h1>
      <p className="text-cp-ink/50 text-sm mb-8">Paiement simulé pour la démo</p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <section className="bg-white rounded-2xl border border-[#E5DDD3] p-6">
            <h2 className="cp-title font-black text-cp-ink text-xl mb-4">Vos coordonnées</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                name="firstName"
                autoComplete="given-name"
                maxLength={50}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                error={errors.firstName}
              />
              <Input
                label="Nom"
                name="lastName"
                autoComplete="family-name"
                maxLength={50}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                error={errors.lastName}
              />
              <Input
                type="email"
                label="Email"
                name="email"
                autoComplete="email"
                inputMode="email"
                maxLength={100}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
              />
              <Input
                type="tel"
                label="Téléphone"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={errors.phone}
              />
            </div>
          </section>

          {/* Livraison */}
          <section className="bg-white rounded-2xl border border-[#E5DDD3] p-6">
            <h2 className="cp-title font-black text-cp-ink text-xl mb-4">Mode de livraison</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {DELIVERY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = form.deliveryOption === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setForm({ ...form, deliveryOption: opt.id })}
                    className={cn(
                      'text-left border-2 rounded-xl p-4 transition-all',
                      isSelected
                        ? 'border-cp-mango bg-cp-mango/5'
                        : 'border-[#E5DDD3] bg-white hover:border-cp-ink/30'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Icon size={24} strokeWidth={1.5} className="text-cp-mango" />
                      {isSelected && (
                        <div className="w-5 h-5 bg-cp-mango rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-cp-ink">{opt.label}</p>
                    <p className="text-xs text-cp-ink/50 mt-1">{opt.description}</p>
                    <p className="text-sm font-semibold text-cp-mango mt-2">
                      {opt.price === 0 ? 'Gratuit' : formatPrice(opt.price)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Adresse */}
          {form.deliveryOption === 'island-delivery' && (
            <section className="bg-white rounded-2xl border border-[#E5DDD3] p-6">
              <h2 className="cp-title font-black text-cp-ink text-xl mb-4">Adresse de livraison</h2>
              <div className="space-y-4">
                <Input
                  label="Adresse"
                  name="address"
                  autoComplete="street-address"
                  maxLength={200}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  error={errors.address}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Code postal"
                    name="postalCode"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={5}
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    error={errors.postalCode}
                    placeholder="97110"
                  />
                  <Input
                    label="Ville"
                    name="city"
                    autoComplete="address-level2"
                    maxLength={100}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    error={errors.city}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Consentements */}
          <section className="bg-white rounded-2xl border border-[#E5DDD3] p-6 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptsCgv}
                onChange={(e) => setForm({ ...form, acceptsCgv: e.target.checked })}
                className="mt-1 accent-cp-mango"
              />
              <span className="text-sm text-cp-ink/70">
                J&apos;accepte les{' '}
                <a href="/mentions-legales" className="text-cp-mango underline">
                  conditions générales de vente
                </a>{' '}
                *
              </span>
            </label>
            {errors.acceptsCgv && <p className="text-xs text-red-500 ml-7">{errors.acceptsCgv}</p>}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptsMarketing}
                onChange={(e) => setForm({ ...form, acceptsMarketing: e.target.checked })}
                className="mt-1 accent-cp-mango"
              />
              <span className="text-sm text-cp-ink/40">
                Je souhaite recevoir les offres et promotions par email (optionnel)
              </span>
            </label>
          </section>
        </div>

        {/* Summary */}
        <aside className="bg-white rounded-2xl border border-[#E5DDD3] shadow-[0_4px_24px_rgba(26,15,6,0.06)] p-6 h-fit sticky top-24">
          <h2 className="cp-title font-black text-cp-ink text-xl mb-4">Récapitulatif</h2>

          <div className="space-y-2 text-sm mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="text-cp-ink/55 truncate">
                  {item.quantity}× {item.name}
                </span>
                <span className="text-cp-ink font-medium flex-shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E5DDD3] pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cp-ink/55">Sous-total</span>
              <span className="text-cp-ink">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cp-ink/55">Livraison</span>
              <span className="text-cp-ink">
                {deliveryPrice === 0 ? 'Gratuit' : formatPrice(deliveryPrice)}
              </span>
            </div>
          </div>

          <div className="border-t border-[#E5DDD3] my-4" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="cp-title font-black text-cp-ink text-lg">Total</span>
            <span className="cp-title font-black text-cp-mango text-2xl">{formatPrice(total)}</span>
          </div>

          {paymentError && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
            >
              <AlertCircle
                size={16}
                strokeWidth={2}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-600">{paymentError}</p>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
            {submitting ? 'Traitement...' : 'Payer (simulation)'}
          </Button>

          <p className="text-xs text-cp-ink/35 text-center mt-3">Aucun paiement réel — mode démo</p>
        </aside>
      </form>
    </div>
  );
}
