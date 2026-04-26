// GP Parts — Configuration centralisée
// Toutes les constantes métier en un seul fichier.
// Modifier ici plutôt que chercher dans le code.

// --- TVA Guadeloupe ---
export const VAT_RATE = 0.085; // 8,5 %

// --- Devise ---
export const CURRENCY = 'EUR';
export const LOCALE = 'fr-FR';

// --- Livraison ---
export const DELIVERY_FEE = 0; // en centimes (0 = gratuit par défaut)
export const FREE_DELIVERY_THRESHOLD = 8000; // en centimes (80 €) — 0 = pas de seuil

// Source unique des options de livraison — partagé client + serveur
// Le champ `icon` est ajouté côté client uniquement (Lucide ne tourne pas serveur)
export const DELIVERY_OPTIONS_CONFIG = [
  {
    id: 'store-pickup' as const,
    label: 'Retrait en boutique',
    description: 'Baie-Mahault · Sous 24h',
    priceInCents: 0,
  },
  {
    id: 'island-delivery' as const,
    label: 'Livraison à domicile',
    description: 'Toute la Guadeloupe · 24-48h',
    priceInCents: 500,
  },
] as const;

export type DeliveryOptionId = (typeof DELIVERY_OPTIONS_CONFIG)[number]['id'];

export function getDeliveryPrice(optionId: string): number {
  return DELIVERY_OPTIONS_CONFIG.find((o) => o.id === optionId)?.priceInCents ?? 0;
}

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
