import { z } from 'zod';

export const createShipmentSchema = z.object({
  orderId: z.string().uuid().optional(), // Can be inferred from URL if nested, or body
  carrier: z.string().min(1, 'Carrier is required'),
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1, 'Shipment must contain at least one item')
});

export const listShipmentsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  cursor: z.string().optional(),
  orderId: z.string().uuid().optional()
});
