import { z } from 'zod';

export const ShipmentItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  batchId: z.string().optional()
});

export const ShipmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().optional(),
  orderId: z.string().uuid(),
  code: z.string().optional(), // In old entity
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  items: z.array(ShipmentItemSchema).min(1),
  status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED']).default('SHIPPED'),
  shippedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
});
