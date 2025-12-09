import { z } from 'zod';

export const listStockQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  cursor: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional()
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  description: z.string().optional()
});

export const createLocationSchema = z.object({
  warehouseId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  description: z.string().optional()
});

export const receiveStockSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.number().int().positive(),
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().datetime().optional(),
  reason: z.string().max(200).optional()
});

export const moveStockSchema = z.object({
  productId: z.string().uuid(),
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().max(200).optional()
});
