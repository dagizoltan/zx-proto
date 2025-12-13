import { z } from 'zod';

export const StockEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  reservedQuantity: z.number().int().nonnegative().default(0),
  batchId: z.string().uuid().optional(),
  updatedAt: z.string().datetime(),
});
