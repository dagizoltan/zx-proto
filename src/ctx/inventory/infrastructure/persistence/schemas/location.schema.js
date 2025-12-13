import { z } from 'zod';

export const LocationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  warehouseId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  code: z.string().min(1),
  type: z.enum(['ZONE', 'AISLE', 'RACK', 'SHELF', 'BIN', 'DOCK', 'STAGING']),
  capacity: z.number().optional(),
  createdAt: z.string().datetime(),
});
