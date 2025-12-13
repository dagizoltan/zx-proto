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
