import { z } from 'zod';
import type { Order } from '@/lib/types';

const orderItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  reference: z.string().min(1),
  priceInCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  image: z.string(),
});

const orderCustomerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().max(100),
  phone: z.string().min(8).max(20),
});

const orderDeliverySchema = z.object({
  option: z.enum(['store-pickup', 'island-delivery']),
  address: z.string().max(200),
  city: z.string().max(100),
  postalCode: z.string().max(5),
  priceInCents: z.number().int().nonnegative(),
});

export const orderSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  status: z.enum(['nouvelle', 'confirmee', 'preparation', 'expediee', 'livree', 'annulee']),
  customer: orderCustomerSchema,
  delivery: orderDeliverySchema,
  items: z.array(orderItemSchema).min(1),
  subtotalInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  acceptsMarketing: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export function parseOrder(data: unknown): Order {
  return orderSchema.parse(data);
}
