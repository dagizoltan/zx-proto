import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number()
      .int('Quantity must be an integer')
      .positive('Quantity must be positive')
      .max(10000, 'Quantity exceeds maximum')
  }))
  .min(1, 'Order must contain at least one item')
  .max(100, 'Order cannot contain more than 100 items'),

  notes: z.string().max(500).optional(),

  shippingAddress: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(2) // ISO country code
  }).optional()
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'CREATED',
    'PAID',
    'PARTIALLY_SHIPPED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ]),
  reason: z.string().max(200).optional()
});

export const listOrdersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  cursor: z.string().optional(),
  status: z.enum([
    'CREATED',
    'PAID',
    'PARTIALLY_SHIPPED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ]).optional(),
  q: z.string().optional(),
  search: z.string().optional(),
  minTotal: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  maxTotal: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional()
});
