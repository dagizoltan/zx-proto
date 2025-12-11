import { z } from 'zod';

export const WarehouseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1).optional(), // Added code, optional to avoid breaking existing data if any? No, seeder needs it.
  location: z.string().optional(),
  type: z.enum(['PHYSICAL', 'VIRTUAL']).default('PHYSICAL'),
  createdAt: z.string().datetime().optional()
});

export const StockEntrySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  batchId: z.string().optional(),
  reserved: z.number().int().nonnegative().default(0),
  updatedAt: z.string().datetime().optional()
});

export const StockMovementSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  type: z.enum(['INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER', 'ALLOCATION', 'PRODUCTION_CONSUME', 'PRODUCTION_OUTPUT']),
  quantity: z.number().int(),
  locationId: z.string().uuid(),
  referenceId: z.string().optional(),
  reason: z.string().optional(),
  timestamp: z.string().datetime()
});

export const BatchSchema = z.object({
    id: z.string().uuid().or(z.string().min(1)),
    sku: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    receivedDate: z.string().datetime().optional(),
    supplierId: z.string().optional(),
    cost: z.number().optional()
});

export const LocationSchema = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().optional(),
  type: z.enum(['BIN', 'RACK', 'PALLET', 'FLOOR']).default('BIN'),
  createdAt: z.string().datetime().optional()
});
