// GP Parts — Utilitaires
// Règle cardinale : les prix sont TOUJOURS en centimes (entier). Jamais de flottant.

import { LOW_STOCK_THRESHOLD } from '@/lib/config';

/**
 * Formate un prix (centimes) en chaîne "65,00 €" avec séparateur français.
 * - Entrée invalide (NaN / non-finie) → "—"
 * - Valeur négative → clampée à 0 (jamais de prix négatif affiché)
 * - Fraction résiduelle → arrondie à l'euro centime le plus proche
 */
export function formatPrice(priceInCents: number, currency: string = 'EUR'): string {
  if (typeof priceInCents !== 'number' || !Number.isFinite(priceInCents)) {
    return '—';
  }
  const safeCents = Math.max(0, Math.round(priceInCents));
  const amount = safeCents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Transforme une chaîne en slug URL-safe.
 * "Disque de frein avant" → "disque-de-frein-avant"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Slug produit canonical : nom + marque principale.
 * Utilisé pour l'URL /catalogue/[slug].
 */
export function productSlug(name: string, brand: string): string {
  return `${slugify(name)}-${slugify(brand)}`;
}

/**
 * Génère un numéro de commande pseudo-unique.
 * Format : GP-[timestamp base36]-[random 4 chars]
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GP-${timestamp}-${random}`;
}

/**
 * Concatène des classes conditionnelles (alternative light à clsx).
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Parse JSON depuis localStorage/sessionStorage de manière safe.
 * Retourne le fallback si la clé est absente, corrompue ou si l'env est SSR.
 */
export function safeJsonParse<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Retourne le statut de stock pour l'affichage badges.
 * Seuil stock faible défini dans lib/config.ts (single source of truth).
 */
export function getStockStatus(stock: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (stock === 0) return 'out-of-stock';
  if (stock <= LOW_STOCK_THRESHOLD) return 'low-stock';
  return 'in-stock';
}

/**
 * Retourne le label de stock en français.
 */
export function getStockLabel(stock: number): string {
  const status = getStockStatus(stock);
  if (status === 'out-of-stock') return 'Rupture';
  if (status === 'low-stock') return `Plus que ${stock}`;
  return 'En stock';
}
