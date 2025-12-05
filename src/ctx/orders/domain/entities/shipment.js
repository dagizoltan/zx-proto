import { z } from 'zod';

export const ShipmentItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const ShipmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  orderId: z.string().uuid(),
  code: z.string().min(1), // e.g., SH-1001
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  items: z.array(ShipmentItemSchema).min(1),
  status: z.enum(['SHIPPED', 'DELIVERED']).default('SHIPPED'),
  shippedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const createShipment = (data) => ShipmentSchema.parse(data);
