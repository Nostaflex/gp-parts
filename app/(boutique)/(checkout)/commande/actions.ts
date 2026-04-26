'use server';

import { generateOrderNumber } from '@/lib/utils';
import { getAdapter } from '@/lib/data';
import { getResend, EMAIL_FROM } from '@/lib/email';
import { buildOrderConfirmationEmail } from '@/lib/emails/orderConfirmation';
import { getDeliveryPrice } from '@/lib/config';
import type { CartItem, Order } from '@/lib/types';

export interface CheckoutValidationResult {
  success: boolean;
  errors: Record<string, string>;
  orderNumber?: string;
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
}): Promise<CheckoutValidationResult> {
  const errors: Record<string, string> = {};

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

  for (const clientItem of formData.items) {
    const product = await adapter.getProductById(clientItem.productId);

    if (!product) {
      errors._items = `Produit introuvable : ${clientItem.productId}`;
      return { success: false, errors };
    }

    const qty = Math.max(
      1,
      Math.min(Math.floor(clientItem.quantity), product.stock > 0 ? product.stock : 1)
    );
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
    createdAt: now,
    updatedAt: now,
  };

  const orderId = await adapter.createOrder(orderData);

  // Email confirmation — fire-and-forget (ne bloque pas le checkout si Resend échoue)
  if (process.env.RESEND_API_KEY) {
    const fullOrder: Order = { ...orderData, id: orderId };
    const { subject, html } = buildOrderConfirmationEmail(fullOrder);
    getResend()
      .emails.send({ from: EMAIL_FROM, to: email, subject, html })
      .catch((err) => console.error('[checkout] Email confirmation failed:', err));
  }

  return { success: true, errors: {}, orderNumber };
}
