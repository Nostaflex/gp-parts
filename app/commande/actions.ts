'use server';

/**
 * Server Action — Validation checkout côté serveur.
 *
 * Valide les données du formulaire de commande indépendamment du client.
 * Empêche la soumission de données malformées même si le JS client est bypassé.
 *
 * Phase actuelle : validation seule (pas de persistence — Phase 4 Firestore).
 * Phase cible : écriture dans Firestore + envoi email confirmation (Phase 6).
 */

export interface CheckoutValidationResult {
  success: boolean;
  errors: Record<string, string>;
  orderNumber?: string;
}

// Limites identiques au client — single source of truth serveur
const FIELD_LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 100,
  phone: 20,
  address: 200,
  city: 100,
  postalCode: 5,
} as const;

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Trim + suppression des caractères de contrôle (sauf espaces normaux)
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GP-${timestamp}-${random}`;
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
}): Promise<CheckoutValidationResult> {
  const errors: Record<string, string> = {};

  // Sanitize all string inputs
  const firstName = sanitize(formData.firstName);
  const lastName = sanitize(formData.lastName);
  const email = sanitize(formData.email);
  const phone = sanitize(formData.phone);
  const address = sanitize(formData.address);
  const city = sanitize(formData.city);
  const postalCode = sanitize(formData.postalCode);
  const deliveryOption = sanitize(formData.deliveryOption);

  // Validate field lengths
  if (!firstName || firstName.length > FIELD_LIMITS.firstName) {
    errors.firstName = 'Prénom requis (50 caractères max)';
  }

  if (!lastName || lastName.length > FIELD_LIMITS.lastName) {
    errors.lastName = 'Nom requis (50 caractères max)';
  }

  // Email validation (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.length > FIELD_LIMITS.email || !emailRegex.test(email)) {
    errors.email = 'Email invalide';
  }

  // Phone validation — format international ou local
  const phoneRegex = /^[0-9+\s().-]{8,20}$/;
  if (!phone || !phoneRegex.test(phone)) {
    errors.phone = 'Téléphone invalide (8-20 caractères)';
  }

  // Delivery option validation
  const validDeliveryOptions = ['store-pickup', 'island-delivery'];
  if (!validDeliveryOptions.includes(deliveryOption)) {
    errors.deliveryOption = 'Mode de livraison invalide';
  }

  // Address fields required for delivery
  if (deliveryOption === 'island-delivery') {
    if (!address || address.length > FIELD_LIMITS.address) {
      errors.address = 'Adresse requise pour la livraison (200 caractères max)';
    }

    if (!city || city.length > FIELD_LIMITS.city) {
      errors.city = 'Ville requise (100 caractères max)';
    }

    // Code postal Guadeloupe : 971xx
    const postalCodeRegex = /^971\d{2}$/;
    if (!postalCode || !postalCodeRegex.test(postalCode)) {
      errors.postalCode = 'Code postal Guadeloupe requis (971xx)';
    }
  }

  // CGV acceptance — must be explicitly true
  if (formData.acceptsCgv !== true) {
    errors.acceptsCgv = 'Vous devez accepter les CGV';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Génération du numéro de commande côté serveur
  const orderNumber = generateOrderNumber();

  // Phase 4+ : ici, écrire dans Firestore
  // Phase 6 : ici, envoyer email de confirmation via Resend

  return { success: true, errors: {}, orderNumber };
}
