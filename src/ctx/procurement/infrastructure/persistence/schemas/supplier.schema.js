import { z } from 'zod';
export const SupplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  createdAt: z.string().datetime().optional()
});
