// GP Parts — Configuration centralisée
// Toutes les constantes métier en un seul fichier.
// Modifier ici plutôt que chercher dans le code.

// --- TVA Guadeloupe ---
export const VAT_RATE = 0.085; // 8,5 %

// --- Devise ---
export const CURRENCY = 'EUR';
export const LOCALE = 'fr-FR';

// --- Livraison ---
// Frais non encore tranchés (chantier produit P2).
// Placeholder : à modifier avant Phase 6 technique.
export const DELIVERY_FEE = 0; // en centimes (0 = gratuit par défaut)
export const FREE_DELIVERY_THRESHOLD = 8000; // en centimes (80 €) — 0 = pas de seuil

// --- Stock ---
// Seuil d'alerte back-office « stock bas »
export const LOW_STOCK_THRESHOLD = 5;

// --- Commandes ---
export const ORDER_PREFIX = 'GP';

// --- Contact ---
// Configurer NEXT_PUBLIC_WHATSAPP_NUMBER dans .env.local (ex: 590123456789)
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '590000000000';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

// --- localStorage keys ---
export const STORAGE_KEYS = {
  cart: 'gpparts-cart',
  lastOrder: 'gpparts-last-order',
  cookieConsent: 'gpparts-cookie-consent',
} as const;
