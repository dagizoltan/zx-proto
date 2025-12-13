import { z } from 'zod';

export const BatchSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  sku: z.string().min(1),
  batchNumber: z.string().min(1),
  expiryDate: z.string().datetime().optional(),
  manufacturingDate: z.string().datetime().optional(),
  cost: z.number().nonnegative().optional(),
  supplierId: z.string().optional(),
  receivedAt: z.string().datetime(),
});
