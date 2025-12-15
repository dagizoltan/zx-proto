import { z } from 'zod';

export const StockMovementSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  productId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum([
    'INBOUND',
    'OUTBOUND',
    'ALLOCATION',
    'ADJUSTMENT',
    'TRANSFER',
    'PRODUCTION_CONSUME',
    'PRODUCTION_OUTPUT'
  ]),
  fromLocationId: z.string().uuid().nullable().optional(),
  toLocationId: z.string().uuid().nullable().optional(),
  referenceId: z.string().optional(),
  batchId: z.string().uuid().optional(),
  reason: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.string().datetime(),
});
