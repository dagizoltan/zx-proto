import { z } from 'zod';

export const WarehouseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
});

export const LocationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  warehouseId: z.string().uuid(),
  parentId: z.string().uuid().optional(), // For hierarchy (Zone -> Aisle -> Bin)
  code: z.string().min(1), // e.g. "Z1", "A05", "B01"
  type: z.enum(['ZONE', 'AISLE', 'RACK', 'SHELF', 'BIN', 'DOCK', 'STAGING']),
  capacity: z.number().optional(), // Max items or volume
  createdAt: z.string().datetime(),
});

export const BatchSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  sku: z.string().min(1),
  batchNumber: z.string().min(1), // Manufacturer lot number
  expiryDate: z.string().datetime().optional(),
  manufacturingDate: z.string().datetime().optional(),
  cost: z.number().nonnegative().optional(), // For FIFO valuation
  supplierId: z.string().optional(),
  receivedAt: z.string().datetime(),
});

export const createWarehouse = (data) => WarehouseSchema.parse(data);
export const createLocation = (data) => LocationSchema.parse(data);
export const createBatch = (data) => BatchSchema.parse(data);
