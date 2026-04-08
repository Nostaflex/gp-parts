import { z } from 'zod';
import type { Product } from '@/lib/types';

const vehicleCompatibilitySchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  yearFrom: z.number().int().min(1900),
  yearTo: z.number().int().min(1900).optional(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  reference: z.string().min(1),
  description: z.string(),
  shortDescription: z.string(),
  price: z.number().int().nonnegative(),
  priceOriginal: z.number().int().nonnegative().optional(),
  images: z.array(z.string()),
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
  compatibility: z.array(vehicleCompatibilitySchema),
  stock: z.number().int().nonnegative(),
  isPromoted: z.boolean(),
  createdAt: z.string(),
});

export function parseProduct(data: unknown): Product {
  return productSchema.parse(data) as Product;
}
