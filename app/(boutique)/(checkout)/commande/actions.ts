'use server';

import { generateOrderNumber } from '@/lib/utils';
import { getAdapter } from '@/lib/data';
import { createOrderIntake, StockInsuffisantError } from '@/lib/server/intake';
import { sendOrderEmails } from '@/lib/emails/send';
import { createOrderPaymentIntent } from '@/lib/stripe';
import { getDeliveryPrice } from '@/lib/config';
import type { CartItem, Order, PaymentMethod } from '@/lib/types';

export interface CheckoutValidationResult {
  success: boolean;
  errors: Record<string, string>;
  orderNumber?: string;
  // Chemin carte uniquement : le client monte le Payment Element avec
  // `clientSecret` puis confirme. `orderId` permet de corréler.
  orderId?: string;
  clientSecret?: string;
}

const FIELD_LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 100,
  phone: 20,
  address: 200,
  city: 100,
  postalCode: 5,
} as const;

const MAX_ITEMS = 50;

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export async function validateCheckout(formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryOption: string;
  acceptsCgv: boolean;
  acceptsMarketing?: boolean;
  items: CartItem[];
  subtotalInCents: number;
  paymentMethod?: PaymentMethod;
  // Clé générée côté client au premier clic — un retry ne crée pas de doublon.
  idempotencyKey?: string;
}): Promise<CheckoutValidationResult> {
  const errors: Record<string, string> = {};

  // Défaut 'on_site' : rétro-compat des appels sans paymentMethod (= comportement
  // historique, emails immédiats). 'card' déclenche le flow Stripe.
  const paymentMethod: PaymentMethod = formData.paymentMethod ?? 'on_site';
  if (paymentMethod !== 'card' && paymentMethod !== 'on_site') {
    errors.paymentMethod = 'Mode de paiement invalide';
  }

  const firstName = sanitize(formData.firstName);
  const lastName = sanitize(formData.lastName);
  const email = sanitize(formData.email);
  const phone = sanitize(formData.phone);
  const address = sanitize(formData.address);
  const city = sanitize(formData.city);
  const postalCode = sanitize(formData.postalCode);
  const deliveryOption = sanitize(formData.deliveryOption);

  if (!firstName || firstName.length > FIELD_LIMITS.firstName) {
    errors.firstName = 'Prénom requis (50 caractères max)';
  }
  if (!lastName || lastName.length > FIELD_LIMITS.lastName) {
    errors.lastName = 'Nom requis (50 caractères max)';
  }

  // Interdire les caractères HTML dans l'email (protection injection)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    !email ||
    email.length > FIELD_LIMITS.email ||
    !emailRegex.test(email) ||
    /[<>"']/.test(email)
  ) {
    errors.email = 'Email invalide';
  }

  const phoneRegex = /^[0-9+\s().-]{8,20}$/;
  if (!phone || !phoneRegex.test(phone)) {
    errors.phone = 'Téléphone invalide (8-20 caractères)';
  }

  const validDeliveryOptions = ['store-pickup', 'island-delivery'];
  if (!validDeliveryOptions.includes(deliveryOption)) {
    errors.deliveryOption = 'Mode de livraison invalide';
  }

  if (deliveryOption === 'island-delivery') {
    if (!address || address.length > FIELD_LIMITS.address) {
      errors.address = 'Adresse requise pour la livraison (200 caractères max)';
    }
    if (!city || city.length > FIELD_LIMITS.city) {
      errors.city = 'Ville requise (100 caractères max)';
    }
    const postalCodeRegex = /^971\d{2}$/;
    if (!postalCode || !postalCodeRegex.test(postalCode)) {
      errors.postalCode = 'Code postal Guadeloupe requis (971xx)';
    }
  }

  if (formData.acceptsCgv !== true) {
    errors.acceptsCgv = 'Vous devez accepter les CGV';
  }

  if (!formData.items || formData.items.length === 0) {
    errors._items = 'Le panier est vide';
  } else if (formData.items.length > MAX_ITEMS) {
    errors._items = 'Panier trop grand (50 articles max)';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // --- Revalidation des prix côté serveur ---
  // On ne fait jamais confiance aux prix venant du client.
  // On récupère chaque produit depuis la BDD et on recalcule le subtotal.
  const adapter = await getAdapter();
  let serverSubtotal = 0;
  const validatedItems: Order['items'] = [];

  // Consolidation : deux lignes du même produit fusionnent (audit S2-3 —
  // les doublons contournaient le plafonnement par le stock).
  const consolidated = new Map<string, CartItem>();
  for (const it of formData.items) {
    const prev = consolidated.get(it.productId);
    consolidated.set(it.productId, prev ? { ...prev, quantity: prev.quantity + it.quantity } : it);
  }

  for (const clientItem of consolidated.values()) {
    const product = await adapter.getProductById(clientItem.productId);

    if (!product) {
      errors._items = `Produit introuvable : ${clientItem.productId}`;
      return { success: false, errors };
    }

    // Refus hors stock EXPLICITE — fini le « stock 0 ⇒ quantité 1 »
    // silencieux. La garde finale (concurrence) vit dans la transaction
    // de createOrderIntake.
    const qty = Math.max(1, Math.floor(clientItem.quantity));
    if (product.stock < qty) {
      errors._items =
        product.stock <= 0
          ? `« ${product.name} » est en rupture de stock.`
          : `« ${product.name} » : seulement ${product.stock} en stock.`;
      return { success: false, errors };
    }
    serverSubtotal += product.price * qty;

    validatedItems.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      reference: product.reference,
      priceInCents: product.price,
      quantity: qty,
      image: product.images[0] ?? '',
    });
  }

  const deliveryPriceInCents = getDeliveryPrice(deliveryOption);
  const now = new Date().toISOString();
  const orderNumber = generateOrderNumber();

  const orderData: Omit<Order, 'id'> = {
    orderNumber,
    status: 'nouvelle',
    customer: { firstName, lastName, email, phone },
    delivery: {
      option: deliveryOption as 'store-pickup' | 'island-delivery',
      address,
      city,
      postalCode,
      priceInCents: deliveryPriceInCents,
    },
    items: validatedItems,
    subtotalInCents: serverSubtotal,
    totalInCents: serverSubtotal + deliveryPriceInCents,
    acceptsMarketing: formData.acceptsMarketing ?? false,
    paymentMethod,
    paymentStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  // Écriture via Admin SDK EXCLUSIVEMENT (audit 2026-08-18) : les règles
  // Firestore refusent désormais toute création client d'orders.
  const rawKey = sanitize(formData.idempotencyKey);
  const idemKey = /^[0-9a-zA-Z-]{16,64}$/.test(rawKey) ? rawKey : undefined;
  let intake;
  try {
    intake = await createOrderIntake(orderData, idemKey);
  } catch (err) {
    if (err instanceof StockInsuffisantError) {
      // Course perdue : un autre client a pris le stock entre la validation
      // et la transaction.
      return {
        success: false,
        errors: {
          _items: 'Un article vient de partir — le stock a été mis à jour, vérifiez votre panier.',
        },
      };
    }
    throw err;
  }
  const orderId = intake.id;

  // Re-soumission (double-clic, retry réseau) : la commande existe déjà —
  // ni doublon, ni second email.
  if (intake.existed) {
    const existingNumber = intake.existingOrderNumber || orderNumber;
    if (paymentMethod === 'card') {
      try {
        const { clientSecret } = await createOrderPaymentIntent({
          id: orderId,
          orderNumber: existingNumber,
          totalInCents: orderData.totalInCents,
        });
        return { success: true, errors: {}, orderNumber: existingNumber, orderId, clientSecret };
      } catch (err) {
        console.error('[checkout] Recréation PaymentIntent échouée:', err);
        return { success: false, errors: { _payment: 'Paiement indisponible, réessayez.' } };
      }
    }
    return { success: true, errors: {}, orderNumber: existingNumber };
  }

  // ── Chemin carte ──────────────────────────────────────────────────
  // La commande est créée 'pending'. On crée le PaymentIntent (montant =
  // total recalculé serveur) et on renvoie le clientSecret au client.
  // Les EMAILS ne partent PAS ici : c'est le webhook qui les envoie au
  // paiement réel (pas de commande fantôme confirmée par mail).
  if (paymentMethod === 'card') {
    try {
      const { clientSecret } = await createOrderPaymentIntent({
        id: orderId,
        orderNumber,
        totalInCents: orderData.totalInCents,
      });
      return { success: true, errors: {}, orderNumber, orderId, clientSecret };
    } catch (err) {
      console.error('[checkout] Création PaymentIntent échouée:', err);
      // Commande 'pending' orpheline laissée en place (cleanup déféré, cf. spec).
      return { success: false, errors: { _payment: 'Paiement indisponible, réessayez.' } };
    }
  }

  // ── Chemin sur place ──────────────────────────────────────────────
  // Emails immédiats (le webhook ne s'applique qu'au chemin carte).
  sendOrderEmails({ ...orderData, id: orderId });

  return { success: true, errors: {}, orderNumber };
}
