import { z } from 'zod';
import type { Product } from '@/lib/types';

export const COMPAT_MAX = 50;
const currentYear = new Date().getFullYear();
const PRICE_CAP = 100_000_000; // 1 000 000,00 € en centimes
const IMAGE_HOST_ALLOW = ['firebasestorage.googleapis.com'];

const httpsAllowedHost = z
  .string()
  .url()
  .refine((u) => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'https:' && IMAGE_HOST_ALLOW.includes(parsed.host);
    } catch {
      return false;
    }
  }, 'host image non autorisé');

const compatibilitySchema = z
  .object({
    brand: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    yearFrom: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 2),
    yearTo: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 2)
      .optional(),
  })
  .refine((c) => c.yearTo === undefined || c.yearTo >= c.yearFrom, 'yearTo < yearFrom');

const baseShape = {
  name: z.string().min(1).max(200),
  reference: z.string().min(1).max(100),
  description: z.string().min(1).max(5000),
  shortDescription: z.string().min(1).max(300),
  price: z.number().int().min(0).max(PRICE_CAP),
  priceOriginal: z.number().int().min(0).max(PRICE_CAP).optional(),
  images: z.array(httpsAllowedHost).min(1).max(8),
  category: z.enum([
    'freinage',
    'moteur',
    'transmission',
    'eclairage',
    'filtres',
    'suspension',
    'electronique',
    'refroidissement',
  ]),
  vehicleType: z.enum(['auto', 'moto']),
  compatibility: z.array(compatibilitySchema).max(COMPAT_MAX),
  stock: z.number().int().min(0),
  isPromoted: z.boolean(),
};

// WRITE: strict → rejette toute clé inconnue ET tout champ server-only (absents du shape)
export const ProductWriteSchema = z.object(baseShape).strict();

// READ: doc Firestore complet (champs server-side inclus). TOLÉRANT (spec §2) :
// `images` override le validateur strict write (httpsAllowedHost) car le read
// schema parse des docs STOCKÉS — fixtures/legacy à chemins locaux (/images/*.jpg)
// ET uploads admin (https firebasestorage). L'allowlist host/https est un contrôle
// d'INPUT (write path), pas un invariant de donnée stockée : l'imposer en lecture
// ferait throw firebase.ts parseProduct sur tout doc à chemin local (catalogue prod cassé).
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ProductSchema = z.object({
  ...baseShape,
  images: z.array(z.string().min(1)).min(1).max(8),
  id: z.string().min(1).max(80).regex(SLUG_RE),
  slug: z.string().min(1).max(80).regex(SLUG_RE),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export function parseProduct(data: unknown): Product {
  return ProductSchema.parse(data) as Product;
}
